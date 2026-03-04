import { getCurrentUser } from "@/lib/auth/current-user";
import type { CampusEvent } from "@/lib/dashboard/types";

type FriendAttendancePayload = {
  byEvent?: Record<string, { count: number; friendUsernames: string[] }>;
  totalEventsWithFriends?: number;
  totalFriendRsvps?: number;
  error?: string;
};

export async function loadFriendAttendanceForEvents(
  apiBaseUrl: string,
  events: CampusEvent[]
) {
  const currentUser = getCurrentUser();
  if (!apiBaseUrl || !currentUser?.id || events.length === 0) {
    return {
      events,
      totalEventsWithFriends: 0,
      totalFriendRsvps: 0,
    };
  }

  const eventIds = events.map((event) => event.id).join(",");
  const params = new URLSearchParams({
    userId: currentUser.id,
    eventIds,
  });
  const res = await fetch(`${apiBaseUrl}/event/friends-attendance?${params.toString()}`);
  const payload = (await res.json()) as FriendAttendancePayload;
  if (!res.ok) {
    throw new Error(payload.error ?? "Could not load friend attendance.");
  }

  const byEvent = payload.byEvent ?? {};
  const eventsWithFriendAttendance = events.map((event) => {
    const entry = byEvent[event.id];
    return {
      ...event,
      friendRsvpCount: entry?.count ?? 0,
      friendRsvpUsernames: entry?.friendUsernames ?? [],
    };
  });

  return {
    events: eventsWithFriendAttendance,
    totalEventsWithFriends: payload.totalEventsWithFriends ?? 0,
    totalFriendRsvps: payload.totalFriendRsvps ?? 0,
  };
}
