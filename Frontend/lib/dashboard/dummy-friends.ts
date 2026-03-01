import type { Friend, RegisteredProfile } from "./types";

/**
 * Dummy: event ids the current user has RSVP'd to. Replace with auth/API when backend is ready.
 */
export const DUMMY_MY_RSVPED_EVENT_IDS = new Set(["1", "7"]);

/**
 * Dummy friends list. Replace with API fetch when backend is ready.
 * eventIds reference DUMMY_EVENTS by id.
 */
export const DUMMY_FRIENDS: Friend[] = [
  { id: "f1", name: "Alex Chen", eventIds: ["1", "5", "7"] },
  { id: "f2", name: "Jordan Rivera", eventIds: ["2", "3", "8"] },
  { id: "f3", name: "Sam Taylor", eventIds: ["4", "9", "10"] },
  { id: "f4", name: "Morgan Lee", eventIds: ["1", "6", "7"] },
];

/**
 * All registered Gaucho RSVP profiles (for add-friend search). Replace with API when backend is ready.
 * Includes current friends (f1–f4) plus other users so search has results.
 */
export const DUMMY_REGISTERED_PROFILES: RegisteredProfile[] = [
  { id: "f1", name: "Alex Chen" },
  { id: "f2", name: "Jordan Rivera" },
  { id: "f3", name: "Sam Taylor" },
  { id: "f4", name: "Morgan Lee" },
  { id: "f5", name: "Jamie Park" },
  { id: "f6", name: "Riley Kim" },
  { id: "f7", name: "Casey Brown" },
  { id: "f8", name: "Avery Davis" },
  { id: "f9", name: "Quinn Wilson" },
  { id: "f10", name: "Jordan Smith" },
  { id: "f11", name: "Alex Morgan" },
  { id: "f12", name: "Sam Lee" },
];
