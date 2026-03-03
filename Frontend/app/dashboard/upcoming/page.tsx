"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EventCard } from "@/components/dashboard/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DUMMY_EVENTS } from "@/lib/dashboard/dummy-events";
import type { CampusEvent, EventCategory } from "@/lib/dashboard/types";
import { loadCategoryRanking, getCategoryRank } from "@/lib/user-preferences";

type TimeRange = "today" | "week" | "month" | "all";

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

function startOfNextLocalMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

function isInRange(eventStartIso: string, range: TimeRange, now: Date) {
  const start = new Date(eventStartIso);
  if (Number.isNaN(start.getTime())) return false;
  if (start < now) return false;
  if (range === "all") return true;
  if (range === "today") return start < endOfLocalDay(now);
  if (range === "week") return start < endOfLocalWeek(now);
  if (range === "month") return start < startOfNextLocalMonth(now);
  return true;
}

function sortPersonalized(events: CampusEvent[], ranking: EventCategory[] | null) {
  return [...events].sort((a, b) => {
    const rankA = getCategoryRank(a.category, ranking);
    const rankB = getCategoryRank(b.category, ranking);
    if (rankA !== rankB) return rankA - rankB;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

function sortByTime(events: CampusEvent[]) {
  return [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export default function UpcomingEventsPage() {
  const [range, setRange] = useState<TimeRange>("week");
  const [personalized, setPersonalized] = useState(true);

  const now = useMemo(() => new Date(), []);
  const ranking = useMemo(() => loadCategoryRanking(), []);

  const inRange = useMemo(
    () => DUMMY_EVENTS.filter((e) => isInRange(e.startTime, range, now)),
    [range, now],
  );

  const events = useMemo(() => {
    const base = personalized ? sortPersonalized(inRange, ranking) : sortByTime(inRange);
    return base;
  }, [inRange, personalized, ranking]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DashboardHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Upcoming events
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse by time range. Turn on personalization to prioritize events you&apos;re
              most likely to care about.
            </p>
          </div>

          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Personalized</span>
                <span className="text-sm font-semibold text-foreground">
                  {personalized ? "On" : "Off"}
                </span>
              </div>
              <Switch checked={personalized} onCheckedChange={setPersonalized} />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span className="text-foreground">For you</span>
              <Badge variant="secondary">{events.length} events</Badge>
              {personalized && ranking ? (
                <span className="text-sm font-normal text-muted-foreground">
                  Prioritizing: {ranking.join(" → ")}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This week</TabsTrigger>
                <TabsTrigger value="month">This month</TabsTrigger>
                <TabsTrigger value="all">All upcoming</TabsTrigger>
              </TabsList>

              <TabsContent value={range} className="mt-4">
                {events.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                    <p>No upcoming events in this range.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="rounded-full border-border">
                        <Link href="/dashboard">View map</Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-full border-border">
                        <Link href="/signup/preferences">Set your preferences</Link>
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {personalized && !ranking ? (
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Personalization is empty</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Set your category ranking to get a personalized ordering.
              <div className="mt-3">
                <Button asChild className="rounded-full">
                  <Link href="/signup/preferences">Rank my interests</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}

