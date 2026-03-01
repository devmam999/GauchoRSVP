"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CampusEvent } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { Check, MapPin } from "lucide-react";

function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface EventCardProps {
  event: CampusEvent;
  /** When true, show a checkmark to indicate current user has RSVP'd */
  isRsvped?: boolean;
  className?: string;
}

export function EventCard({ event, isRsvped, className }: EventCardProps) {
  const link = event.rsvpLink ?? event.sourceLink;
  const linkLabel = event.rsvpLink ? "RSVP / Register" : "More info";

  return (
    <Card
      className={cn(
        "border-border bg-card text-card-foreground rounded-xl border py-4 shadow-sm",
        className
      )}
    >
      <CardHeader className="pb-1 px-4">
        <CardTitle className="flex items-start justify-between gap-2 text-sm font-semibold leading-tight">
          <span className="text-foreground">{event.name}</span>
          {isRsvped && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary"
              title="You're going"
            >
              <Check className="h-3 w-3" />
              Going
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-4 text-sm text-muted-foreground">
        <p>{formatEventDateTime(event.startTime)}</p>
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {event.location}
        </p>
        <p>
          {event.category}
          {event.subtype ? ` · ${event.subtype}` : ""}
        </p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-medium text-primary underline underline-offset-2 hover:no-underline"
          >
            {linkLabel} →
          </a>
        )}
      </CardContent>
    </Card>
  );
}
