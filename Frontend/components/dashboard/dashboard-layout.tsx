"use client";

import { useState, useMemo } from "react";
import { DashboardHeader } from "./dashboard-header";
import { SidebarPanel } from "./sidebar-panel";
import { EventMapView } from "./map/event-map";
import { filterEvents } from "@/lib/dashboard/filter-events";
import { DUMMY_EVENTS } from "@/lib/dashboard/dummy-events";
import type { EventFilters } from "@/lib/dashboard/types";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_FILTERS: EventFilters = {
  categories: [],
  foodProvided: "any",
  freeAdmissionOnly: false,
  timeRange: "all",
};

/**
 * Dashboard layout: header, filters sidebar, and event map.
 * Uses dummy data until backend is connected.
 */
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);

  const filteredEvents = useMemo(
    () => filterEvents(DUMMY_EVENTS, filters),
    [filters]
  );

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
          events={filteredEvents}
        />

        <main
          className="relative flex-1 min-h-[50vh] sm:min-h-0"
          aria-label="Map view"
        >
          <div className="absolute inset-0 p-3 sm:p-4">
            <EventMapView
              darkTiles
              className="h-full w-full"
              events={filteredEvents}
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
