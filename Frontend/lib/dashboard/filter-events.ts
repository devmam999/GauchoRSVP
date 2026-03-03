import type { CampusEvent, EventFilters } from "./types";

function eventInTimeRange(startTime: string, timeRange: EventFilters["timeRange"]): boolean {
  const now = new Date();
  const start = new Date(startTime);
  if (timeRange === "all") return start >= now;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  if (timeRange === "today") return start >= now && start < endOfToday;
  if (timeRange === "week") return start >= now && start < endOfWeek;
  if (timeRange === "month") return start >= now && start < startOfNextMonth;
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
