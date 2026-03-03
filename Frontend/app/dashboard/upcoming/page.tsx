"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EventCard } from "@/components/dashboard/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DUMMY_EVENTS } from "@/lib/dashboard/dummy-events";
import type { CampusEvent, EventCategory } from "@/lib/dashboard/types";
import { getCategoryRank, loadCategoryRanking } from "@/lib/user-preferences";
import { Clock3, Filter } from "lucide-react";

type TimeRange = "today" | "tomorrow" | "week" | "month" | "custom" | "all";
type PriorityFilter = EventCategory | "freeAdmission";

const CATEGORY_FILTER_OPTIONS: Array<{ value: PriorityFilter; label: string }> = [
  { value: "Social", label: "Social" },
  { value: "Academic", label: "Academic" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Sports", label: "Sports" },
  { value: "freeAdmission", label: "Free admission" },
];

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
  if (start < now) return false;

  if (range === "all") return true;
  if (range === "today") return start < endOfLocalDay(now);
  if (range === "tomorrow") {
    const tomorrowStart = startOfTomorrow(now);
    const tomorrowEnd = endOfTomorrow(now);
    return start >= tomorrowStart && start < tomorrowEnd;
  }
  if (range === "week") return start < endOfLocalWeek(now);
  if (range === "month") return start < startOfNextLocalMonth(now);
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

function sortByTime(events: CampusEvent[]) {
  return [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export default function UpcomingEventsPage() {
  const [range, setRange] = useState<TimeRange>("week");
  const [selectedPriorityFilters, setSelectedPriorityFilters] = useState<PriorityFilter[]>(
    [],
  );
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [timeFilterOpen, setTimeFilterOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const now = useMemo(() => new Date(), []);
  const ranking = useMemo(() => loadCategoryRanking(), []);

  const activePriorityCount = selectedPriorityFilters.length;

  const events = useMemo(() => {
    const inTimeRange = DUMMY_EVENTS.filter((event) =>
      isInRange(event.startTime, range, now, customStart, customEnd),
    );

    const selectedCategories = selectedPriorityFilters.filter(
      (item): item is EventCategory => item !== "freeAdmission",
    );
    const freeAdmissionSelected =
      selectedPriorityFilters.includes("freeAdmission");

    const sorted = [...inTimeRange].sort((a, b) => {
      const aSelectedCategory = selectedCategories.includes(a.category);
      const bSelectedCategory = selectedCategories.includes(b.category);
      const aSelectedFree = freeAdmissionSelected && a.freeAdmission;
      const bSelectedFree = freeAdmissionSelected && b.freeAdmission;

      const aIsPriority = aSelectedCategory || aSelectedFree;
      const bIsPriority = bSelectedCategory || bSelectedFree;
      if (aIsPriority !== bIsPriority) return aIsPriority ? -1 : 1;

      if (aSelectedCategory && bSelectedCategory) {
        const rankA = getCategoryRank(a.category, ranking);
        const rankB = getCategoryRank(b.category, ranking);
        if (rankA !== rankB) return rankA - rankB;
      } else if (aSelectedCategory !== bSelectedCategory) {
        return aSelectedCategory ? -1 : 1;
      }

      if (aSelectedFree !== bSelectedFree) return aSelectedFree ? -1 : 1;

      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return sorted;
  }, [range, now, customStart, customEnd, selectedPriorityFilters, ranking]);

  const togglePriorityFilter = (value: PriorityFilter) => {
    setSelectedPriorityFilters((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
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
            <Popover open={categoryFilterOpen} onOpenChange={setCategoryFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-border bg-card/70 px-4 backdrop-blur-sm"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Category filter
                  {activePriorityCount > 0 ? (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                      {activePriorityCount}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[min(92vw,24rem)] rounded-2xl border border-border/70 bg-card/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-md"
              >
                <p className="mb-3 text-xs text-muted-foreground">
                  These options prioritize events first, but do not hide other events.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_FILTER_OPTIONS.map((option) => {
                    const selected = selectedPriorityFilters.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => togglePriorityFilter(option.value)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-all duration-200 hover:scale-105 ${
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
          </div>
        </div>

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
                <p>No upcoming events match the current filters.</p>
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

