"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardHeader } from "./dashboard-header";
import { SidebarPanel } from "./sidebar-panel";
import { EventMapView } from "./map/event-map";
import { filterEvents } from "@/lib/dashboard/filter-events";
import type { CampusEvent, EventFilters } from "@/lib/dashboard/types";
import { distanceMilesBetween, estimateTravel } from "@/lib/dashboard/travel";
import { loadFriendAttendanceForEvents } from "@/lib/dashboard/friend-attendance";
import { loadEngagementForEvents } from "@/lib/dashboard/engagement";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_FILTERS: EventFilters = {
  eventTargetAudience: [],
  eventTopic: [],
  eventTypes: [],
  nearestOnly: false,
  friendPriority: false,
  ratingPriority: false,
};

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
      lowerTypes.some((t) =>
        t.includes("performance") || t.includes("exhibition")
      )
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

function isEventNotPast(event: CampusEvent, now: Date) {
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return false;

  const end = event.endTime ? new Date(event.endTime) : null;
  if (end && !Number.isNaN(end.getTime())) {
    return end >= now;
  }

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
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

/**
 * Dashboard layout: header, filters sidebar, and event map.
 * Fetches events from the backend (Localist API via Convex).
 * If events fail to load, the map and list remain empty.
 */
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [backendEvents, setBackendEvents] = useState<CampusEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";
    if (!apiBaseUrl) {
      return;
    }

    let cancelled = false;
    async function loadEvents() {
      try {
        setIsLoading(true);
        const res = await fetch(`${apiBaseUrl}/events`);
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { events?: BackendEvent[] };
        if (!data.events || cancelled) return;
        const mapped = data.events.map(mapBackendEventToCampusEvent);
        const withFriends = await loadFriendAttendanceForEvents(apiBaseUrl, mapped);
        const withEngagement = await loadEngagementForEvents(
          apiBaseUrl,
          withFriends.events
        );
        if (!cancelled) {
          setBackendEvents(withEngagement);
        }
      } catch {
        // ignore errors; backendEvents stays null
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceEvents = useMemo(
    () => (backendEvents ?? []).filter((event) => isEventNotPast(event, now)),
    [backendEvents, now]
  );

  const eventsWithTravel = useMemo(() => {
    if (!userLocation) return sourceEvents;
    return sourceEvents.map((event) => {
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
    });
  }, [sourceEvents, userLocation]);

  const filteredEvents = useMemo(
    () => filterEvents(eventsWithTravel, filters),
    [eventsWithTravel, filters]
  );

  const visibleEvents = useMemo(() => {
    const friendPriority = !!filters.friendPriority;
    const ratingPriority = !!filters.ratingPriority;
    const prioritySorter = friendPriority && ratingPriority
      ? compareFriendsAndRating
      : friendPriority
        ? compareFriendsOnly
        : ratingPriority
          ? compareRatingOnly
          : null;

    if (!filters.nearestOnly || !userLocation) {
      return prioritySorter
        ? [...filteredEvents].sort(prioritySorter)
        : [...filteredEvents].sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
    }
    return [...filteredEvents]
      .sort((a, b) => {
        const byDistance =
          (a.distanceMiles ?? Number.POSITIVE_INFINITY) -
          (b.distanceMiles ?? Number.POSITIVE_INFINITY);
        if (byDistance !== 0) return byDistance;
        return prioritySorter ? prioritySorter(a, b) : compareFriendsOnly(a, b);
      })
      .slice(0, 10);
  }, [
    filteredEvents,
    filters.friendPriority,
    filters.nearestOnly,
    filters.ratingPriority,
    userLocation,
  ]);

  const handleRequestLocation = () => {
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
      }
    );
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.13),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_40%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.10),transparent_35%)]" />
      <DashboardHeader />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col sm:flex-row">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-10 bg-black/50 sm:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}
        <SidebarPanel
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          className="max-sm:pt-12 max-sm:z-20"
          filters={filters}
          onFiltersChange={setFilters}
          onRequestLocation={handleRequestLocation}
          isLocating={isLocating}
          hasLocation={!!userLocation}
          locationError={locationError}
          allEvents={eventsWithTravel}
        />

        <main
          className="relative flex-1 min-h-[50vh] sm:min-h-0"
          aria-label="Map view"
        >
          <div className="absolute inset-0 p-3 sm:p-4">
            <EventMapView
              darkTiles
              className="h-full w-full"
              events={visibleEvents}
            />
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className={cn(
              "absolute left-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border/70 bg-card/80 text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:left-6 sm:top-4 sm:hidden"
            )}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </button>
        </main>
      </div>
    </div>
  );
}
