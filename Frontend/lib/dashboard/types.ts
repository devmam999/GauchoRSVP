/**
 * Event and filter types for the dashboard map.
 * Replace with API types when backend is connected.
 */

export type EventCategory =
  | "Social"
  | "Academic"
  | "Entertainment"
  | "Sports";

export const EVENT_CATEGORIES: EventCategory[] = [
  "Social",
  "Academic",
  "Entertainment",
  "Sports",
];

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
  description?: string;
  descriptionHtml?: string;
  photoUrl?: string;
  localistNumAttending?: number;
  allowsAttendance?: boolean;
  distanceMiles?: number;
  walkMinutes?: number;
  bikeMinutes?: number;
  friendRsvpCount?: number;
  friendRsvpUsernames?: string[];
  engagementAverageRating?: number;
  engagementReviewCount?: number;
  targetAudience?: string[];
  topics?: string[];
  types?: string[];
}

export interface EventFilters {
  eventTargetAudience: string[];
  eventTopic: string[];
  eventTypes: string[];
  nearestOnly?: boolean;
  friendPriority?: boolean;
  ratingPriority?: boolean;
}

/** Friend type for Friends page. Replace with API type when backend is ready. */
export interface Friend {
  id: string;
  name: string;
  /** Optional profile image URL; use AvatarFallback with initials if missing */
  profileImageUrl?: string;
  /** Event ids this friend is attending (references CampusEvent.id) */
  eventIds: string[];
}

/** Registered Gaucho RSVP profile (searchable for add friend). Replace with API when backend is ready. */
export interface RegisteredProfile {
  id: string;
  name: string;
  profileImageUrl?: string;
}

/** User profile for the logged-in user. Replace with API type when backend is ready. */
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  profileImageUrl?: string;
  major?: string;
  year?: string;
  bio?: string;
  homeBase?: string;
  preferredEventTypes: EventCategory[];
  notificationPreferences: {
    emailEvents: boolean;
    emailReminders: boolean;
    emailFriendActivity: boolean;
  };
}
