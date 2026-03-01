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
import { useEffect } from "react";
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
    <div className="min-w-[200px] max-w-[280px] sm:min-w-[240px] sm:max-w-[320px] text-left">
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

function MapMarker({ event }: { event: CampusEvent }) {
  return (
    <Marker position={event.position}>
      <Popup>
        <EventPopupContent event={event} />
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
        {events.map((event) => (
          <MapMarker key={event.id} event={event} />
        ))}
      </MapContainer>
    </div>
  );
}
