"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampusEvent, EventFilters } from "@/lib/dashboard/types";

export interface SidebarPanelProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  /** Current filters; controlled by parent */
  filters: EventFilters;
  onFiltersChange: (f: EventFilters) => void;
  onRequestLocation?: () => void;
  isLocating?: boolean;
  hasLocation?: boolean;
  locationError?: string | null;
  /** All loaded events, used to derive Localist filter values */
  allEvents: CampusEvent[];
}

export function SidebarPanel({
  className,
  isOpen = true,
  onClose,
  filters,
  onFiltersChange,
  onRequestLocation,
  isLocating = false,
  hasLocation = false,
  locationError,
  allEvents,
}: SidebarPanelProps) {
  const targetAudienceOptions = Array.from(
    new Set(allEvents.flatMap((event) => event.targetAudience ?? []))
  ).sort();
  const topicOptions = Array.from(
    new Set(allEvents.flatMap((event) => event.topics ?? []))
  ).sort();
  const eventTypeOptions = Array.from(
    new Set(allEvents.flatMap((event) => event.types ?? []))
  ).sort();

  const toggleArrayFilter = (
    key: keyof EventFilters,
    value: string
  ) => {
    const currentValues = filters[key] as string[];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    onFiltersChange({
      ...filters,
      [key]: nextValues,
    });
  };

  const chipClass = (selected: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-sm text-left transition-all duration-200 hover:scale-[1.02]",
      selected
        ? "border-blue-400 bg-blue-500/30 text-blue-100"
        : "border-border/70 bg-background/50 text-foreground hover:bg-muted/70"
    );

  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-4 overflow-auto border-border bg-background transition-all sm:w-80 sm:min-w-0 sm:border-r sm:shrink-0",
        "max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-20 max-sm:w-[min(100%,20rem)] max-sm:border-r max-sm:shadow-lg",
        !isOpen && "max-sm:translate-x-[-100%] max-sm:opacity-0",
        className
      )}
      aria-label="Filters"
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
          aria-label="Close sidebar"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      )}

      <div className="flex flex-col gap-4 p-4 sm:p-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Location
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onRequestLocation?.()}
                  className="rounded-full border border-border/70 bg-background/50 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/70"
                >
                  {isLocating
                    ? "Getting location..."
                    : hasLocation
                      ? "Refresh location"
                      : "Use my location"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      nearestOnly: !filters.nearestOnly,
                    })
                  }
                  className={chipClass(!!filters.nearestOnly)}
                  aria-pressed={!!filters.nearestOnly}
                  aria-label="Show nearest events only"
                >
                  Show nearest events only
                </button>
                {locationError ? (
                  <p className="text-xs text-destructive">{locationError}</p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Smart ranking
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      friendPriority: !filters.friendPriority,
                    })
                  }
                  className={chipClass(!!filters.friendPriority)}
                  aria-pressed={!!filters.friendPriority}
                >
                  Friends priority
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      ratingPriority: !filters.ratingPriority,
                    })
                  }
                  className={chipClass(!!filters.ratingPriority)}
                  aria-pressed={!!filters.ratingPriority}
                >
                  Rating priority
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                If both are selected: {"<"}1-star gap favors friends, {">"}1-star gap favors rating.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                        onFiltersChange({
                          ...filters,
                          eventTargetAudience: selected ? [] : [option],
                        })
                      }
                      className={chipClass(selected)}
                      aria-pressed={selected}
                      aria-label={`Filter by ${option}`}
                    >
                      {option}
                    </button>
                  );
                })}
                {targetAudienceOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No audience filters available.
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Event topic
              </p>
              <div className="flex flex-wrap gap-2">
                {topicOptions.map((option) => {
                  const selected = filters.eventTopic.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArrayFilter("eventTopic", option)}
                      className={chipClass(selected)}
                      aria-pressed={selected}
                      aria-label={`Filter by ${option}`}
                    >
                      {option}
                    </button>
                  );
                })}
                {topicOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No topic filters available.
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Event types
              </p>
              <div className="flex flex-wrap gap-2">
                {eventTypeOptions.map((option) => {
                  const selected = filters.eventTypes.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArrayFilter("eventTypes", option)}
                      className={chipClass(selected)}
                      aria-pressed={selected}
                      aria-label={`Filter by ${option}`}
                    >
                      {option}
                    </button>
                  );
                })}
                {eventTypeOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No event type filters available.
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </aside>
  );
}
