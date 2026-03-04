"use client";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CampusEvent } from "@/lib/dashboard/types";

// Default OpenStreetMap tile layer
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const DARK_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const DEFAULT_CENTER: [number, number] = [34.414, -119.8489];
const DEFAULT_ZOOM = 14;

function useFixLeafletIcon() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);
  return null;
}

function formatEventDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function EventPopupContent({ event }: { event: CampusEvent }) {
  const link = event.rsvpLink ?? event.sourceLink;
  const linkLabel = event.rsvpLink ? "RSVP / Register" : "More info";

  return (
    <div
      className="min-w-[200px] max-w-[280px] sm:min-w-[240px] sm:max-w-[320px] text-left"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <h3 className="font-semibold text-primary text-base mb-1.5">
        {event.name}
      </h3>
      <dl className="space-y-1 text-sm text-muted-foreground">
        <div>
          <dt className="sr-only">Time & date</dt>
          <dd>{formatEventDateTime(event.startTime)}</dd>
          {event.endTime && (
            <dd className="text-xs mt-0.5">
              to {formatEventDateTime(event.endTime)}
            </dd>
          )}
        </div>
        <div>
          <dt className="sr-only">Location</dt>
          <dd>{event.location}</dd>
        </div>
        <div>
          <dt className="sr-only">Type</dt>
          <dd>
            {event.category}
            {event.subtype ? ` · ${event.subtype}` : ""}
          </dd>
        </div>
        {(event.foodProvided || event.freeAdmission) && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {event.foodProvided === "free" && (
              <span className="text-primary">Food provided (free)</span>
            )}
            {event.foodProvided === "costs-extra" && (
              <span>Food costs extra</span>
            )}
            {event.freeAdmission && (
              <span className="text-primary">Free admission</span>
            )}
          </div>
        )}
      </dl>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-2 hover:no-underline"
        >
          {linkLabel} →
        </a>
      )}
    </div>
  );
}

function GroupedEventPopupContent({ events }: { events: CampusEvent[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;

  if (!selectedEvent) return null;

  if (events.length === 1) {
    return <EventPopupContent event={selectedEvent} />;
  }

  if (!selectedEventId) {
    return (
      <div
        className="min-w-[220px] max-w-[320px]"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-sm font-semibold text-primary">
          Events at this location ({events.length})
        </h3>
        <div className="space-y-1.5">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedEventId(event.id);
              }}
              className="w-full rounded-md border border-border bg-card/70 px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
            >
              {event.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedEventId(null);
        }}
        className="mb-2 text-xs font-medium text-primary underline underline-offset-2"
      >
        ← Back to all events at this location
      </button>
      <EventPopupContent event={selectedEvent} />
    </div>
  );
}

function MapMarker({ events }: { events: CampusEvent[] }) {
  const firstEvent = events[0];
  if (!firstEvent) return null;

  return (
    <Marker position={firstEvent.position}>
      <Popup>
        <GroupedEventPopupContent events={events} />
      </Popup>
    </Marker>
  );
}

export interface EventMapViewProps {
  center?: [number, number];
  zoom?: number;
  darkTiles?: boolean;
  className?: string;
  /** Events to show as markers; click shows details (name, time, location, type, link) */
  events?: CampusEvent[];
}

export function EventMapView({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  darkTiles = true,
  className,
  events = [],
}: EventMapViewProps) {
  useFixLeafletIcon();
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, CampusEvent[]>();
    for (const event of events) {
      const key = `${event.position[0]},${event.position[1]}`;
      const existing = groups.get(key);
      if (existing) {
        existing.push(event);
      } else {
        groups.set(key, [event]);
      }
    }
    return Array.from(groups.values());
  }, [events]);

  return (
    <div
      className={cn(
        "relative z-0 h-full w-full rounded-xl overflow-hidden border border-border",
        className
      )}
      role="application"
      aria-label="Event map"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full rounded-xl bg-muted"
        scrollWheelZoom
        style={{ minHeight: 280 }}
      >
        <MapController center={center} />
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url={darkTiles ? DARK_TILE_URL : LIGHT_TILE_URL}
        />
        {groupedEvents.map((group) => {
          const first = group[0];
          const groupKey = first
            ? `${first.position[0]},${first.position[1]}`
            : "empty-group";
          return <MapMarker key={groupKey} events={group} />;
        })}
      </MapContainer>
    </div>
  );
}
