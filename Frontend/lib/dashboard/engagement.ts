import type { CampusEvent } from "@/lib/dashboard/types";

type EngagementBatchPayload = {
  byEvent?: Record<
    string,
    { averageRating: number; reviewCount: number; rsvpCount: number }
  >;
  error?: string;
};

export async function loadEngagementForEvents(
  apiBaseUrl: string,
  events: CampusEvent[]
) {
  if (!apiBaseUrl || events.length === 0) {
    return events;
  }

  const eventIds = events.map((event) => event.id).join(",");
  const params = new URLSearchParams({ eventIds });
  const res = await fetch(`${apiBaseUrl}/event/engagement/batch?${params.toString()}`);
  const payload = (await res.json()) as EngagementBatchPayload;
  if (!res.ok) {
    throw new Error(payload.error ?? "Could not load event engagement.");
  }

  const byEvent = payload.byEvent ?? {};
  return events.map((event) => ({
    ...event,
    engagementAverageRating: byEvent[event.id]?.averageRating ?? 0,
    engagementReviewCount: byEvent[event.id]?.reviewCount ?? 0,
  }));
}
