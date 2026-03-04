import type { CampusEvent, EventFilters } from "./types";

export function filterEvents(
  events: CampusEvent[],
  filters: EventFilters
): CampusEvent[] {
  return events.filter((event) => {
    const targetAudience = event.targetAudience ?? [];
    const topics = event.topics ?? [];
    const types = event.types ?? [];

    if (
      filters.eventTargetAudience.length > 0 &&
      !filters.eventTargetAudience.some((selected) =>
        targetAudience.includes(selected)
      )
    ) {
      return false;
    }
    if (
      filters.eventTopic.length > 0 &&
      !filters.eventTopic.some((selected) => topics.includes(selected))
    ) {
      return false;
    }
    if (
      filters.eventTypes.length > 0 &&
      !filters.eventTypes.some((selected) => types.includes(selected))
    ) {
      return false;
    }
    return true;
  });
}
