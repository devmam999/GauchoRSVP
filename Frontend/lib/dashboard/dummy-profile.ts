import type { UserProfile } from "./types";

/**
+ * Dummy user profile for the logged-in user.
 * Replace with real data from the backend when auth is connected.
+ */
export const DUMMY_USER_PROFILE: UserProfile = {
  id: "user-1",
  name: "Gaucho Tester",
  username: "gaucho_tester",
  email: "gaucho.tester@ucsb.edu",
  profileImageUrl: undefined,
  major: "Computer Science",
  year: "3rd Year",
  bio: "Exploring UCSB events, studying at the library, and catching Gaucho games.",
  homeBase: "Isla Vista, CA",
  preferredEventTypes: ["Social", "Academic", "Entertainment", "Sports"],
  notificationPreferences: {
    emailEvents: true,
    emailReminders: true,
    emailFriendActivity: false,
  },
};

