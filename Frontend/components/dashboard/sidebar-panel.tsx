"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Filter, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampusEvent, EventFilters, EventCategory } from "@/lib/dashboard/types";
import { EVENT_CATEGORIES, FOOD_OPTIONS, TIME_RANGE_OPTIONS } from "@/lib/dashboard/types";

export interface SidebarPanelProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  /** Current filters; controlled by parent */
  filters: EventFilters;
  onFiltersChange: (f: EventFilters) => void;
  /** Filtered events to list (from parent) */
  events: CampusEvent[];
  /** Optional: scroll map to event when user clicks list item */
  onSelectEvent?: (event: CampusEvent) => void;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SidebarPanel({
  className,
  isOpen = true,
  onClose,
  filters,
  onFiltersChange,
  events,
  onSelectEvent,
}: SidebarPanelProps) {
  const toggleCategory = (cat: EventCategory) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFiltersChange({ ...filters, categories: next });
  };

  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-4 overflow-auto border-border bg-background transition-all sm:w-80 sm:min-w-0 sm:border-r sm:shrink-0",
        "max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-20 max-sm:w-[min(100%,20rem)] max-sm:border-r max-sm:shadow-lg",
        !isOpen && "max-sm:translate-x-[-100%] max-sm:opacity-0",
        className
      )}
      aria-label="Filters and events"
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
                Type of event
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {EVENT_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <Checkbox
                      checked={filters.categories.includes(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                      aria-label={`Filter by ${cat}`}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Food provided
              </p>
              <RadioGroup
                value={filters.foodProvided === null ? "any" : filters.foodProvided}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    foodProvided: value as EventFilters["foodProvided"],
                  })
                }
                className="flex flex-wrap gap-x-4 gap-y-2"
              >
                {FOOD_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <RadioGroupItem value={opt.value} aria-label={opt.label} />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={filters.freeAdmissionOnly}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      freeAdmissionOnly: !!checked,
                    })
                  }
                  aria-label="Free admission only"
                />
                Free admission only
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Time range
              </p>
              <RadioGroup
                value={filters.timeRange}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    timeRange: value as EventFilters["timeRange"],
                  })
                }
                className="flex flex-wrap gap-x-4 gap-y-2"
              >
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <RadioGroupItem value={opt.value} aria-label={opt.label} />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card flex-1 min-h-0 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Upcoming events
              <span className="text-muted-foreground font-normal">
                ({events.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-[200px] sm:h-[240px] px-4 pb-4">
              <ul className="space-y-2 pr-4">
                {events.length === 0 ? (
                  <li className="text-sm text-muted-foreground py-4">
                    No events match the current filters.
                  </li>
                ) : (
                  events.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onSelectEvent?.(event)}
                        className={cn(
                          "w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                      >
                        <span className="font-medium text-foreground text-sm block truncate">
                          {event.name}
                        </span>
                        <span className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatShortDate(event.startTime)} · {event.category}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
