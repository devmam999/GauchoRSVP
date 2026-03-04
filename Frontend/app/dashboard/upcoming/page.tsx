"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EventCard } from "@/components/dashboard/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CampusEvent, EventFilters } from "@/lib/dashboard/types";
import { distanceMilesBetween, estimateTravel } from "@/lib/dashboard/travel";
import { loadFriendAttendanceForEvents } from "@/lib/dashboard/friend-attendance";
import { loadEngagementForEvents } from "@/lib/dashboard/engagement";
import { Clock3, Filter, LocateFixed } from "lucide-react";
import { filterEvents } from "@/lib/dashboard/filter-events";

type TimeRange = "today" | "tomorrow" | "week" | "month" | "custom" | "all";

const DEFAULT_FILTERS: EventFilters = {
  eventTargetAudience: [],
  eventTopic: [],
  eventTypes: [],
  nearestOnly: false,
  friendPriority: false,
  ratingPriority: false,
};

const TIME_FILTER_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Date + time range" },
  { value: "all", label: "All upcoming" },
];

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d: Date) {
  const start = startOfLocalDay(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
}

function endOfLocalWeek(d: Date) {
  const start = startOfLocalDay(d);
  const startOfWeek = new Date(start);
  startOfWeek.setDate(start.getDate() - start.getDay());
  const end = new Date(startOfWeek);
  end.setDate(end.getDate() + 7);
  return end;
}

function startOfTomorrow(d: Date) {
  const start = startOfLocalDay(d);
  start.setDate(start.getDate() + 1);
  return start;
}

function endOfTomorrow(d: Date) {
  const start = startOfTomorrow(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
}

function startOfNextLocalMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

function isInRange(
  eventStartIso: string,
  range: TimeRange,
  now: Date,
  customStart: string,
  customEnd: string,
) {
  const start = new Date(eventStartIso);
  if (Number.isNaN(start.getTime())) return false;
  const startOfToday = startOfLocalDay(now);

  if (range === "all") return start >= startOfToday;
  if (range === "today") return start >= startOfToday && start < endOfLocalDay(now);
  if (range === "tomorrow") {
    const tomorrowStart = startOfTomorrow(now);
    const tomorrowEnd = endOfTomorrow(now);
    return start >= tomorrowStart && start < tomorrowEnd;
  }
  if (range === "week") return start >= startOfToday && start < endOfLocalWeek(now);
  if (range === "month") return start >= startOfToday && start < startOfNextLocalMonth(now);
  if (range === "custom") {
    const parsedCustomStart = customStart ? new Date(customStart) : null;
    const parsedCustomEnd = customEnd ? new Date(customEnd) : null;

    if (parsedCustomStart && !Number.isNaN(parsedCustomStart.getTime()) && start < parsedCustomStart) {
      return false;
    }
    if (parsedCustomEnd && !Number.isNaN(parsedCustomEnd.getTime()) && start > parsedCustomEnd) {
      return false;
    }
    return true;
  }

  return true;
}

function isEventNotPast(event: CampusEvent, now: Date) {
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return false;

  const end = event.endTime ? new Date(event.endTime) : null;
  if (end && !Number.isNaN(end.getTime())) {
    return end >= now;
  }

  const startOfToday = startOfLocalDay(now);
  return start >= startOfToday;
}

function compareFriendsAndRating(a: CampusEvent, b: CampusEvent) {
  const ratingA = a.engagementAverageRating ?? 0;
  const ratingB = b.engagementAverageRating ?? 0;
  const friendA = a.friendRsvpCount ?? 0;
  const friendB = b.friendRsvpCount ?? 0;
  const diff = Math.abs(ratingA - ratingB);

  if (diff > 1) {
    if (ratingA !== ratingB) return ratingB - ratingA;
    if (friendA !== friendB) return friendB - friendA;
  } else {
    if (friendA !== friendB) return friendB - friendA;
    if (ratingA !== ratingB) return ratingB - ratingA;
  }

  return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
}

function compareFriendsOnly(a: CampusEvent, b: CampusEvent) {
  const byFriends = (b.friendRsvpCount ?? 0) - (a.friendRsvpCount ?? 0);
  if (byFriends !== 0) return byFriends;
  return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
}

function compareRatingOnly(a: CampusEvent, b: CampusEvent) {
  const byRating = (b.engagementAverageRating ?? 0) - (a.engagementAverageRating ?? 0);
  if (byRating !== 0) return byRating;
  return compareFriendsOnly(a, b);
}

type BackendEvent = {
  id: number;
  title: string;
  description: string;
  descriptionHtml: string;
  photoUrl: string | null;
  locationName: string;
  address: string | null;
  allowsAttendance: boolean;
  free: boolean;
  startTime: string | null;
  endTime: string | null;
  localistNumAttending: number;
  latitude: number;
  longitude: number;
  targetAudience: string[];
  topics: string[];
  types: string[];
  url: string | null;
};

function mapBackendEventToCampusEvent(event: BackendEvent): CampusEvent {
  const pickCategory = (topics: string[], types: string[]) => {
    const lowerTopics = topics.map((t) => t.toLowerCase());
    const lowerTypes = types.map((t) => t.toLowerCase());

    if (lowerTypes.some((t) => t.includes("sport"))) {
      return "Sports" as const;
    }
    if (
      lowerTopics.some((t) => t.includes("science") || t.includes("tech")) ||
      lowerTypes.some((t) => t.includes("class") || t.includes("workshop"))
    ) {
      return "Academic" as const;
    }
    if (
      lowerTopics.some((t) => t.includes("arts")) ||
      lowerTypes.some((t) => t.includes("performance") || t.includes("exhibition"))
    ) {
      return "Entertainment" as const;
    }
    return "Social" as const;
  };

  return {
    id: String(event.id),
    name: event.title,
    position: [event.latitude, event.longitude],
    startTime: event.startTime ?? new Date().toISOString(),
    endTime: event.endTime ?? undefined,
    location: event.locationName || event.address || "",
    category: pickCategory(event.topics, event.types),
    subtype: undefined,
    foodProvided: null,
    freeAdmission: event.free,
    rsvpLink: event.url ?? undefined,
    sourceLink: event.url ?? undefined,
    description: event.description,
    descriptionHtml: event.descriptionHtml,
    photoUrl: event.photoUrl ?? undefined,
    localistNumAttending: event.localistNumAttending,
    allowsAttendance: event.allowsAttendance,
    targetAudience: event.targetAudience,
    topics: event.topics,
    types: event.types,
  };
}

export default function UpcomingEventsPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";
  const [range, setRange] = useState<TimeRange>("week");
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [timeFilterOpen, setTimeFilterOpen] = useState(false);
  const [nearestOnly, setNearestOnly] = useState(false);
  const [friendPriority, setFriendPriority] = useState(false);
  const [ratingPriority, setRatingPriority] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sourceEvents, setSourceEvents] = useState<CampusEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!apiBaseUrl) return;

    let cancelled = false;
    async function loadEvents() {
      try {
        setIsLoading(true);
        const res = await fetch(`${apiBaseUrl}/events`);
        if (!res.ok) return;
        const data = (await res.json()) as { events?: BackendEvent[] };
        if (!data.events || cancelled) return;
        const mapped = data.events.map(mapBackendEventToCampusEvent);
        const withFriends = await loadFriendAttendanceForEvents(apiBaseUrl, mapped);
        const withEngagement = await loadEngagementForEvents(
          apiBaseUrl,
          withFriends.events
        );
        if (!cancelled) {
          setSourceEvents(withEngagement);
        }
      } catch {
        // Keep existing list if request fails.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadEvents();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const activeFilterCount =
    filters.eventTargetAudience.length +
    filters.eventTopic.length +
    filters.eventTypes.length;

  const requestLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported on this browser.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError("Could not get your location. Check browser permissions.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      },
    );
  };

  const events = useMemo(() => {
    const inTimeRange = sourceEvents
      .filter((event) => isEventNotPast(event, now))
      .filter((event) => isInRange(event.startTime, range, now, customStart, customEnd));
    const filteredByDashboardFilters = filterEvents(inTimeRange, filters);

    const withTravel = userLocation
      ? filteredByDashboardFilters.map((event) => {
          const distanceMiles = distanceMilesBetween(userLocation, {
            latitude: event.position[0],
            longitude: event.position[1],
          });
          const travel = estimateTravel(distanceMiles);
          return {
            ...event,
            distanceMiles: travel.distanceMiles,
            walkMinutes: travel.walkMinutes,
            bikeMinutes: travel.bikeMinutes,
          };
        })
      : filteredByDashboardFilters;

    const prioritySorter = friendPriority && ratingPriority
      ? compareFriendsAndRating
      : friendPriority
        ? compareFriendsOnly
        : ratingPriority
          ? compareRatingOnly
          : null;

    if (nearestOnly && userLocation) {
      return [...withTravel]
        .sort((a, b) => {
          const byDistance =
            (a.distanceMiles ?? Number.POSITIVE_INFINITY) -
            (b.distanceMiles ?? Number.POSITIVE_INFINITY);
          if (byDistance !== 0) return byDistance;
          return prioritySorter ? prioritySorter(a, b) : compareFriendsOnly(a, b);
        })
        .slice(0, 10);
    }

    if (prioritySorter) {
      return [...withTravel].sort(prioritySorter);
    }

    return [...withTravel].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [
    filters,
    sourceEvents,
    range,
    now,
    customStart,
    customEnd,
    userLocation,
    nearestOnly,
    friendPriority,
    ratingPriority,
  ]);

  const targetAudienceOptions = useMemo(
    () => Array.from(new Set(sourceEvents.flatMap((event) => event.targetAudience ?? []))).sort(),
    [sourceEvents]
  );
  const topicOptions = useMemo(
    () =>
      Array.from(new Set(sourceEvents.flatMap((event) => event.topics ?? [])))
        .filter((option) => option.toLowerCase() !== "housing")
        .sort(),
    [sourceEvents]
  );
  const eventTypeOptions = useMemo(
    () => Array.from(new Set(sourceEvents.flatMap((event) => event.types ?? []))).sort(),
    [sourceEvents]
  );

  const chipClass = (selected: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 ${
      selected
        ? "border-blue-400 bg-blue-500/30 text-blue-100"
        : "border-border/70 bg-background/50 text-foreground hover:bg-muted/70"
    }`;

  const toggleArrayFilter = (key: "eventTopic" | "eventTypes", value: string) => {
    const currentValues = filters[key];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    setFilters({
      ...filters,
      [key]: nextValues,
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_38%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_35%)]" />
      <DashboardHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Upcoming events
            </h1>
            <p className="text-sm text-muted-foreground">
              Use category filters to prioritize what appears first. Time filters are the only filters that exclude events.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-border bg-card/70 px-4 backdrop-blur-sm"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 ? (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[min(92vw,24rem)] rounded-2xl border border-border/70 bg-card/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-md"
              >
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Event target audience
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {targetAudienceOptions.map((option) => {
                        const selected = filters.eventTargetAudience.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setFilters({
                                ...filters,
                                eventTargetAudience: selected ? [] : [option],
                              })
                            }
                            className={chipClass(selected)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Event topic
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {topicOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleArrayFilter("eventTopic", option)}
                          className={chipClass(filters.eventTopic.includes(option))}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Event types
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {eventTypeOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleArrayFilter("eventTypes", option)}
                          className={chipClass(filters.eventTypes.includes(option))}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={timeFilterOpen} onOpenChange={setTimeFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-border bg-card/70 px-4 backdrop-blur-sm"
                >
                  <Clock3 className="mr-2 h-4 w-4" />
                  Time filter
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[min(92vw,19rem)] rounded-2xl border border-border/70 bg-card/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-md"
              >
                <p className="mb-3 text-xs text-muted-foreground">
                  Time filter excludes events outside the selected range.
                </p>
                <div className="grid gap-2">
                  {TIME_FILTER_OPTIONS.map((option) => {
                    const selected = range === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRange(option.value)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition-all duration-200 ${
                          selected
                            ? "border-blue-400 bg-blue-500/30 text-blue-100"
                            : "border-border/70 bg-background/50 text-foreground hover:bg-muted/70"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {range === "custom" ? (
                  <div className="mt-3 grid gap-2">
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      Start date/time
                      <input
                        type="datetime-local"
                        value={customStart}
                        onChange={(event) => setCustomStart(event.target.value)}
                        className="rounded-lg border border-border/70 bg-background/60 px-2 py-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                      End date/time
                      <input
                        type="datetime-local"
                        value={customEnd}
                        onChange={(event) => setCustomEnd(event.target.value)}
                        className="rounded-lg border border-border/70 bg-background/60 px-2 py-2 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2"
                      />
                    </label>
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>
            <Button
              variant={nearestOnly ? "default" : "outline"}
              className="rounded-full border-border px-4"
              onClick={() => {
                if (!nearestOnly && !userLocation) {
                  requestLocation();
                }
                setNearestOnly((prev) => !prev);
              }}
            >
              <LocateFixed className="mr-2 h-4 w-4" />
              {nearestOnly ? "Nearest on" : "Nearest"}
            </Button>
            <Button
              variant={friendPriority ? "default" : "outline"}
              className="rounded-full border-border px-4"
              onClick={() => setFriendPriority((prev) => !prev)}
            >
              Friends priority
            </Button>
            <Button
              variant={ratingPriority ? "default" : "outline"}
              className="rounded-full border-border px-4"
              onClick={() => setRatingPriority((prev) => !prev)}
            >
              Rating priority
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-border bg-card/70 px-4 backdrop-blur-sm"
              onClick={requestLocation}
            >
              {isLocating ? "Getting location..." : userLocation ? "Refresh location" : "Use my location"}
            </Button>
          </div>
        </div>
        {locationError ? (
          <p className="text-xs text-destructive">{locationError}</p>
        ) : null}

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span className="text-foreground">Filtered events</span>
              <Badge variant="secondary">{events.length} events</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {events.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                <p>
                  {isLoading
                    ? "Loading events from UCSB Localist..."
                    : "No upcoming events match the current filters."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="rounded-full border-border">
                    <Link href="/dashboard">View map</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {events.map((event) => (
                  <li key={event.id} className="min-w-0">
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

