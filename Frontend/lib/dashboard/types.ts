/**
 * Event and filter types for the dashboard map.
 * Replace with API types when backend is connected.
 */

export type EventCategory =
  | "Social"
  | "Academic"
  | "Entertainment"
  | "Sports";

export type EventSubtype =
  | "Block party"
  | "Laid-back"
  | "Study group"
  | "CoE"
  | "CoLS"
  | "CoCS"
  | "Mathematics"
  | "Science"
  | "Arts"
  | "Professor Talk"
  | "Band performance"
  | "Theater Play"
  | "Film screening"
  | "Mens' Basketball"
  | "Womens' Basketball"
  | "Baseball"
  | "Food provided";

export type FoodProvided = "free" | "costs-extra" | null;

export interface CampusEvent {
  id: string;
  name: string;
  position: [number, number];
  /** ISO date-time string */
  startTime: string;
  /** ISO date-time string, optional */
  endTime?: string;
  location: string;
  category: EventCategory;
  subtype?: EventSubtype;
  /** null = not specified */
  foodProvided: FoodProvided;
  freeAdmission: boolean;
  /** RSVP or registration link */
  rsvpLink?: string;
  /** Source / info link */
  sourceLink?: string;
}

export type TimeRangeFilter = "all" | "today" | "week" | "month";

export interface EventFilters {
  categories: EventCategory[];
  foodProvided: FoodProvided | "any";
  freeAdmissionOnly: boolean;
  timeRange: TimeRangeFilter;
}

export const TIME_RANGE_OPTIONS: { value: TimeRangeFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

export const EVENT_CATEGORIES: EventCategory[] = [
  "Social",
  "Academic",
  "Entertainment",
  "Sports",
];

export const FOOD_OPTIONS: { value: "any" | "free" | "costs-extra"; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "free", label: "Free" },
  { value: "costs-extra", label: "Costs extra" },
];
