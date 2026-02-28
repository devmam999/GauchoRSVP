"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { CampusEvent } from "@/lib/dashboard/types";

export interface EventMapProps {
  events?: CampusEvent[];
  center?: [number, number];
  zoom?: number;
  darkTiles?: boolean;
  className?: string;
}

// Load map only on client to avoid Leaflet/window SSR issues
const EventMapViewInner = dynamic(
  () => import("./event-map-view").then((mod) => mod.EventMapView),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn(
          "flex h-full min-h-[280px] w-full items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground"
        )}
      >
        <span className="text-sm">Loading map…</span>
      </div>
    ),
  }
);

export function EventMapView(props: EventMapProps) {
  return <EventMapViewInner {...props} />;
}
