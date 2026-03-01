import type { CampusEvent, EventFilters } from "./types";

function eventInTimeRange(startTime: string, timeRange: EventFilters["timeRange"]): boolean {
  if (timeRange === "all") return true;
  const start = new Date(startTime);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (timeRange === "today") return start >= startOfToday && start < endOfToday;
  if (timeRange === "week") return start >= startOfWeek;
  if (timeRange === "month") return start >= startOfMonth;
  return true;
}

export function filterEvents(
  events: CampusEvent[],
  filters: EventFilters
): CampusEvent[] {
  return events.filter((event) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(event.category)
    ) {
      return false;
    }
    if (filters.foodProvided !== "any" && event.foodProvided !== filters.foodProvided) {
      return false;
    }
    if (filters.freeAdmissionOnly && !event.freeAdmission) {
      return false;
    }
    if (!eventInTimeRange(event.startTime, filters.timeRange)) {
      return false;
    }
    return true;
  });
}
