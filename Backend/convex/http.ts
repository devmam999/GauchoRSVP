import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

declare const process: {
  env: Record<string, string | undefined>;
};

const http = httpRouter();

type JsonRecord = Record<string, unknown>;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
    },
  });
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string) {
  const payload = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return toHex(new Uint8Array(digest));
}

function createSalt() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  return toHex(randomBytes);
}

function parseStringField(body: JsonRecord, field: string) {
  const value = body[field];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email.trim());
}

function randomHex(size = 16) {
  const randomBytes = crypto.getRandomValues(new Uint8Array(size));
  return toHex(randomBytes);
}

function baseUsernameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "gaucho";
  const safe = localPart.toLowerCase().replace(/[^a-z0-9_]/g, "");
  return safe || "gaucho";
}

function frontendRedirect(path: string, params?: Record<string, string>) {
  const frontendBaseUrl = process.env.FRONTEND_APP_URL;
  if (!frontendBaseUrl) {
    throw new Error("Missing FRONTEND_APP_URL in backend environment.");
  }
  const redirectUrl = new URL(path, frontendBaseUrl);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      redirectUrl.searchParams.set(key, value);
    }
  }
  return redirectUrl.toString();
}

function oauthCallbackUrl(requestUrl: string) {
  const requestOrigin = new URL(requestUrl).origin;
  return new URL("/oauth/google/callback", requestOrigin).toString();
}

function buildGoogleAuthUrl(state: string, redirectUri: string) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID in backend environment.");
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", googleClientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return authUrl.toString();
}

http.route({
  path: "/signup",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/login",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/verify-email",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/users",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/user",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/friends/registered-users",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/oauth/google/callback",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/friend",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/friend/notify-email",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/notifications",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/message",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/messageIMG",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/block",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/blcok",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/event/rsvp",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/event/engagement",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/event/engagement/batch",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/event/friends-attendance",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/event/reviews",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/event/review-image",
  method: "OPTIONS",
  handler: httpAction(async () => optionsResponse()),
});

http.route({
  path: "/signup",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const provider = new URL(request.url).searchParams.get("provider");
    if (provider !== "google") {
      return jsonResponse({ error: "Only provider=google is supported on GET /signup." }, 400);
    }

    try {
      const state = `signup:${randomHex(20)}`;
      const redirectUri = oauthCallbackUrl(request.url);
      await ctx.runMutation(internal.auth.saveOauthState, {
        state,
        flow: "signup",
        redirectUri,
      });
      return Response.redirect(buildGoogleAuthUrl(state, redirectUri), 302);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google OAuth start failed.";
      return jsonResponse({ error: message }, 500);
    }
  }),
});

http.route({
  path: "/login",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const provider = new URL(request.url).searchParams.get("provider");
    if (provider !== "google") {
      return jsonResponse({ error: "Only provider=google is supported on GET /login." }, 400);
    }

    try {
      const state = `login:${randomHex(20)}`;
      const redirectUri = oauthCallbackUrl(request.url);
      await ctx.runMutation(internal.auth.saveOauthState, {
        state,
        flow: "login",
        redirectUri,
      });
      return Response.redirect(buildGoogleAuthUrl(state, redirectUri), 302);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google OAuth start failed.";
      return jsonResponse({ error: message }, 500);
    }
  }),
});

http.route({
  path: "/signup",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const provider = parseStringField(body, "provider") ?? "local";
    if (provider !== "local" && provider !== "google") {
      return jsonResponse({ error: "provider must be local or google." }, 400);
    }

    const email = parseStringField(body, "email");
    const username = parseStringField(body, "username");
    if (!email || !username) {
      return jsonResponse({ error: "email and username are required." }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse(
        { error: "Please enter a valid email address (example: you@domain.com)." },
        400
      );
    }

    if (provider === "google") {
      const googleId = parseStringField(body, "googleId") ?? undefined;
      try {
        const user = await ctx.runMutation(internal.auth.createOrGetGoogleUser, {
          email,
          username,
          googleId,
        });

        return jsonResponse(
          {
            message: "Google signup successful.",
            user: {
              id: user._id,
              email: user.email,
              username: user.username,
              authProvider: "google",
            },
          },
          201,
        );
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes("already exists") ||
            error.message.includes("already in use")
          ) {
            return jsonResponse({ error: error.message }, 409);
          }
          return jsonResponse({ error: error.message }, 400);
        }
        return jsonResponse({ error: "Unexpected signup error." }, 500);
      }
    }

    const password = parseStringField(body, "password");
    if (!password) {
      return jsonResponse({ error: "password is required for local signup." }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters." }, 400);
    }

    const passwordSalt = createSalt();
    const passwordHash = await hashPassword(password, passwordSalt);

    try {
      const user = await ctx.runMutation(internal.auth.createLocalUser, {
        email,
        username,
        passwordHash,
        passwordSalt,
      });

      if (user.kind === "email_in_use") {
        return jsonResponse({ error: "Email is already in use." }, 409);
      }
      if (user.kind === "username_in_use") {
        return jsonResponse({ error: "Username is already in use." }, 409);
      }

      return jsonResponse(
        {
          message:
            user.kind === "updated_unverified"
              ? "Signup details refreshed."
              : "Signup successful.",
          requiresEmailVerification: false,
          user: {
            id: user.userId,
            email: user.email,
            username: user.username,
            authProvider: "local",
            emailVerified: true,
          },
        },
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        return jsonResponse({ error: error.message }, 400);
      }
      return jsonResponse({ error: "Unexpected signup error." }, 500);
    }
  }),
});

http.route({
  path: "/login",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const provider = parseStringField(body, "provider") ?? "local";
    if (provider !== "local" && provider !== "google") {
      return jsonResponse({ error: "provider must be local or google." }, 400);
    }

    const identifier = parseStringField(body, "identifier");
    if (!identifier) {
      return jsonResponse({ error: "identifier is required." }, 400);
    }

    const user = await ctx.runQuery(internal.auth.findUserByIdentifier, {
      identifier,
    });

    if (!user) {
      return jsonResponse({ error: "Invalid credentials." }, 401);
    }

    if (provider === "google") {
      if (user.authProvider !== "google") {
        return jsonResponse(
          { error: "This account uses password login. Use standard login instead." },
          400,
        );
      }

      return jsonResponse({
        message: "Google login successful.",
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          authProvider: user.authProvider,
        },
      });
    }

    const password = parseStringField(body, "password");
    if (!password) {
      return jsonResponse({ error: "password is required for local login." }, 400);
    }

    if (!user.passwordSalt || !user.passwordHash) {
      return jsonResponse(
        { error: "This account uses Google login. Use Google instead." },
        400,
      );
    }

    const computedHash = await hashPassword(password, user.passwordSalt);
    if (computedHash !== user.passwordHash) {
      return jsonResponse({ error: "Invalid credentials." }, 401);
    }
    return jsonResponse({
      message: "Login successful.",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        emailVerified: true,
      },
    });
  }),
});

http.route({
  path: "/verify-email",
  method: "POST",
  handler: httpAction(async () => {
    return jsonResponse({
      message: "Email verification is disabled.",
      user: null,
    });
  }),
});

http.route({
  path: "/users",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const users = await ctx.runQuery(internal.auth.listUsers, {});
    return jsonResponse({ users });
  }),
});

http.route({
  path: "/events",
  method: "GET",
  handler: httpAction(async () => {
    try {
      const res = await fetch(
        "https://campuscalendar.ucsb.edu/api/2/events?pp=50",
      );
      if (!res.ok) {
        return jsonResponse(
          { error: "Failed to fetch events from Localist API." },
          502,
        );
      }

      const data = (await res.json()) as {
        events?: Array<{
          event?: {
            id: number;
            title: string;
            description_text?: string;
            description?: string;
            photo_url?: string;
            location_name?: string;
            address?: string | null;
            allows_attendance?: boolean;
            free?: boolean;
            geo?: {
              latitude?: string | null;
              longitude?: string | null;
              city?: string | null;
            };
            event_instances?: Array<{
              event_instance?: {
                start?: string;
                end?: string | null;
                num_attending?: number;
              };
            }>;
            filters?: {
              event_target_audience?: Array<{ name: string }>;
              event_topic?: Array<{ name: string }>;
              event_types?: Array<{ name: string }>;
            };
            localist_url?: string;
          };
        }>;
      };

      const events =
        data.events
          ?.map((wrapper) => wrapper.event)
          .filter((event): event is NonNullable<typeof event> => !!event)
          .map((event) => {
            const instance = event.event_instances?.[0]?.event_instance;
            const lat = event.geo?.latitude
              ? Number(event.geo.latitude)
              : null;
            const lng = event.geo?.longitude
              ? Number(event.geo.longitude)
              : null;

            // Only keep events that have coordinates near UCSB/IV
            if (
              lat == null ||
              lng == null ||
              lat < 34.39 ||
              lat > 34.43 ||
              lng < -119.87 ||
              lng > -119.83
            ) {
              return null;
            }

            const targetAudience =
              event.filters?.event_target_audience?.map((item) => item.name) ?? [];
            const topics = event.filters?.event_topic?.map((t) => t.name) ?? [];
            const types = event.filters?.event_types?.map((t) => t.name) ?? [];

            return {
              id: event.id,
              title: event.title,
              description: event.description_text ?? "",
              descriptionHtml: event.description ?? "",
              photoUrl: event.photo_url ?? null,
              locationName: event.location_name ?? "",
              address: event.address ?? "",
              allowsAttendance: !!event.allows_attendance,
              free: !!event.free,
              startTime: instance?.start ?? null,
              endTime: instance?.end ?? null,
              localistNumAttending: instance?.num_attending ?? 0,
              latitude: lat,
              longitude: lng,
              targetAudience,
              topics,
              types,
              url: event.localist_url ?? null,
            };
          })
          .filter((e): e is NonNullable<typeof e> => !!e) ?? [];

      return jsonResponse({ events });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected events error.";
      return jsonResponse({ error: message }, 500);
    }
  }),
});

http.route({
  path: "/event/rsvp",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const requestUrl = new URL(request.url);
    const eventId = requestUrl.searchParams.get("eventId");
    const userId = requestUrl.searchParams.get("userId");
    if (!eventId) {
      return jsonResponse({ error: "eventId is required." }, 400);
    }

    try {
      const summary = await ctx.runQuery(internal.auth.getEventRsvpSummary, {
        eventId,
        userId: userId ?? undefined,
      });
      return jsonResponse(summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load RSVP summary.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/event/engagement",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const requestUrl = new URL(request.url);
    const eventId = requestUrl.searchParams.get("eventId");
    const userId = requestUrl.searchParams.get("userId");
    if (!eventId) {
      return jsonResponse({ error: "eventId is required." }, 400);
    }

    try {
      const summary = await ctx.runQuery(internal.auth.getEventEngagementSummary, {
        eventId,
        userId: userId ?? undefined,
      });
      return jsonResponse(summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load event engagement.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/event/engagement/batch",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const requestUrl = new URL(request.url);
    const eventIdsParam = requestUrl.searchParams.get("eventIds");
    if (!eventIdsParam) {
      return jsonResponse({ error: "eventIds is required." }, 400);
    }

    const eventIds = eventIdsParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (eventIds.length === 0) {
      return jsonResponse({ error: "eventIds is required." }, 400);
    }
    if (eventIds.length > 300) {
      return jsonResponse({ error: "Too many eventIds provided." }, 400);
    }

    try {
      const summary = await ctx.runQuery(internal.auth.getEventsEngagementBatch, {
        eventIds,
      });
      return jsonResponse(summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load event engagement batch.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/event/friends-attendance",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const requestUrl = new URL(request.url);
    const userId = requestUrl.searchParams.get("userId");
    const eventIdsParam = requestUrl.searchParams.get("eventIds");

    if (!userId) {
      return jsonResponse({ error: "userId is required." }, 400);
    }
    if (!eventIdsParam) {
      return jsonResponse({ error: "eventIds is required." }, 400);
    }

    const eventIds = eventIdsParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (eventIds.length === 0) {
      return jsonResponse({ error: "eventIds is required." }, 400);
    }
    if (eventIds.length > 300) {
      return jsonResponse({ error: "Too many eventIds provided." }, 400);
    }

    try {
      const summary = await ctx.runQuery(internal.auth.getFriendsEventAttendance, {
        userId,
        eventIds,
      });
      return jsonResponse(summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load friends attendance.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/event/rsvp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const eventId = parseStringField(body, "eventId");
    const userId = parseStringField(body, "userId");
    if (!eventId || !userId) {
      return jsonResponse({ error: "eventId and userId are required." }, 400);
    }

    try {
      const rsvp = await ctx.runMutation(internal.auth.toggleEventRsvp, {
        eventId,
        userId,
      });
      const summary = await ctx.runQuery(internal.auth.getEventRsvpSummary, {
        eventId,
        userId,
      });
      return jsonResponse({
        userHasRsvped: rsvp.userHasRsvped,
        count: summary.count,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update RSVP status.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/event/review-image",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const formData = await request.formData();
      const image = formData.get("image");
      if (!(image instanceof Blob)) {
        return jsonResponse({ error: "image file is required." }, 400);
      }

      const storageId = await ctx.storage.store(image);
      const imageUrl = await ctx.storage.getUrl(storageId);
      return jsonResponse({
        imageStorageId: String(storageId),
        imageUrl: imageUrl ?? null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not upload review image.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/event/reviews",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) {
      return jsonResponse({ error: "eventId is required." }, 400);
    }

    try {
      const result = await ctx.runQuery(internal.auth.listEventReviews, { eventId });
      return jsonResponse(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load event reviews.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/event/reviews",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const eventId = parseStringField(body, "eventId");
    const userId = parseStringField(body, "userId");
    const reviewText = parseStringField(body, "reviewText");
    const imageStorageId = parseStringField(body, "imageStorageId") ?? undefined;
    const imageUrl = parseStringField(body, "imageUrl") ?? undefined;
    const ratingValue = body.rating;
    const rating =
      typeof ratingValue === "number"
        ? ratingValue
        : typeof ratingValue === "string"
          ? Number(ratingValue)
          : NaN;

    if (!eventId || !userId || !reviewText || Number.isNaN(rating)) {
      return jsonResponse(
        { error: "eventId, userId, rating, and reviewText are required." },
        400
      );
    }

    try {
      await ctx.runMutation(internal.auth.upsertEventReview, {
        eventId,
        userId,
        rating,
        reviewText,
        imageStorageId,
        imageUrl,
      });

      const result = await ctx.runQuery(internal.auth.listEventReviews, { eventId });
      return jsonResponse(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save event review.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/user",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return jsonResponse({ error: "userId is required." }, 400);
    }

    const user = await ctx.runQuery(internal.auth.getUserById, { userId });
    if (!user) {
      return jsonResponse({ error: "User not found." }, 404);
    }
    return jsonResponse({ user });
  }),
});

http.route({
  path: "/friends/registered-users",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const users = await ctx.runQuery(internal.auth.listUsers, {});
    return jsonResponse({ users });
  }),
});

http.route({
  path: "/friend",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return jsonResponse({ error: "userId is required." }, 400);
    }

    try {
      const context = await ctx.runQuery(internal.auth.getFriendContext, { userId });
      return jsonResponse(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load friend context.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/friend",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const action = parseStringField(body, "action") ?? "request";

    if (action === "request") {
      const requesterId = parseStringField(body, "requesterId");
      const addresseeId = parseStringField(body, "addresseeId");
      if (!requesterId || !addresseeId) {
        return jsonResponse(
          { error: "requesterId and addresseeId are required for friend requests." },
          400
        );
      }

      try {
        const result = await ctx.runMutation(internal.auth.sendFriendRequest, {
          requesterId,
          addresseeId,
        });

        return jsonResponse({
          message:
            result.status === "accepted"
              ? "Friend request accepted."
              : "Friend request sent.",
          requestId: result.requestId,
          status: result.status,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not send friend request.";
        return jsonResponse({ error: message }, 400);
      }
    }

    if (action === "accept" || action === "reject") {
      const requestId = parseStringField(body, "requestId");
      const responderId = parseStringField(body, "responderId");
      if (!requestId || !responderId) {
        return jsonResponse(
          { error: "requestId and responderId are required to respond." },
          400
        );
      }

      try {
        const result = await ctx.runMutation(internal.auth.respondToFriendRequest, {
          requestId,
          responderId,
          action,
        });
        return jsonResponse({
          message:
            result.status === "accepted"
              ? "Friend request accepted."
              : "Friend request rejected.",
          requestId: result.requestId,
          status: result.status,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not respond to request.";
        return jsonResponse({ error: message }, 400);
      }
    }

    return jsonResponse({ error: "Unsupported action. Use request, accept, or reject." }, 400);
  }),
});

http.route({
  path: "/friend/notify-email",
  method: "POST",
  handler: httpAction(async () => {
    return jsonResponse({ message: "Email notifications are disabled." });
  }),
});

http.route({
  path: "/notifications",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return jsonResponse({ error: "userId is required." }, 400);
    }

    try {
      const notifications = await ctx.runQuery(internal.auth.listNotifications, {
        userId,
      });
      return jsonResponse({ notifications });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load notifications.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/notifications",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const action = parseStringField(body, "action");
    const userId = parseStringField(body, "userId");
    if (!action || !userId) {
      return jsonResponse({ error: "action and userId are required." }, 400);
    }

    if (action === "mark_read_all") {
      await ctx.runMutation(internal.auth.markAllNotificationsRead, { userId });
      return jsonResponse({ message: "Notifications marked as read." });
    }

    if (action === "delete") {
      const notificationId = parseStringField(body, "notificationId");
      if (!notificationId) {
        return jsonResponse({ error: "notificationId is required." }, 400);
      }
      try {
        await ctx.runMutation(internal.auth.deleteNotification, {
          userId,
          notificationId,
        });
        return jsonResponse({ message: "Notification removed." });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not delete notification.";
        return jsonResponse({ error: message }, 400);
      }
    }

    return jsonResponse(
      { error: "Unsupported action. Use mark_read_all or delete." },
      400
    );
  }),
});

http.route({
  path: "/message",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const requestUrl = new URL(request.url);
    const userId = requestUrl.searchParams.get("userId");
    const otherUserId = requestUrl.searchParams.get("otherUserId");
    if (!userId) {
      return jsonResponse({ error: "userId is required." }, 400);
    }

    try {
      if (otherUserId) {
        const messages = await ctx.runQuery(internal.auth.getConversation, {
          userId,
          otherUserId,
        });
        return jsonResponse({ messages });
      }

      const threads = await ctx.runQuery(internal.auth.listMessageThreads, {
        userId,
      });
      return jsonResponse({ threads });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load messages.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/message",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const senderId = parseStringField(body, "senderId");
    const recipientId = parseStringField(body, "recipientId");
    const text = parseStringField(body, "text");
    if (!senderId || !recipientId) {
      return jsonResponse({ error: "senderId and recipientId are required." }, 400);
    }
    if (!text) {
      return jsonResponse({ error: "text is required." }, 400);
    }

    try {
      const result = await ctx.runMutation(internal.auth.sendMessage, {
        senderId,
        recipientId,
        text,
      });

      return jsonResponse({ message: "Message sent.", messageId: result.messageId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send message.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/messageIMG",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const formData = await request.formData();
    const senderIdValue = formData.get("senderId");
    const recipientIdValue = formData.get("recipientId");
    const textValue = formData.get("text");
    const imageValue = formData.get("image");

    const senderId =
      typeof senderIdValue === "string" && senderIdValue.trim().length > 0
        ? senderIdValue.trim()
        : null;
    const recipientId =
      typeof recipientIdValue === "string" && recipientIdValue.trim().length > 0
        ? recipientIdValue.trim()
        : null;
    const text =
      typeof textValue === "string" && textValue.trim().length > 0 ? textValue.trim() : undefined;

    if (!senderId || !recipientId) {
      return jsonResponse({ error: "senderId and recipientId are required." }, 400);
    }
    if (!(imageValue instanceof Blob)) {
      return jsonResponse({ error: "image file is required." }, 400);
    }

    try {
      const storageId = await ctx.storage.store(imageValue);
      const imageUrl = await ctx.storage.getUrl(storageId);
      const result = await ctx.runMutation(internal.auth.sendMessage, {
        senderId,
        recipientId,
        text,
        imageStorageId: String(storageId),
        imageUrl: imageUrl ?? undefined,
      });

      return jsonResponse({
        message: "Image message sent.",
        messageId: result.messageId,
        imageUrl: imageUrl ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send image message.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/block",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return jsonResponse({ error: "userId is required." }, 400);
    }

    const blocked = await ctx.runQuery(internal.auth.listBlockedUsers, { userId });
    return jsonResponse({ blocked });
  }),
});

http.route({
  path: "/block",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const action = parseStringField(body, "action");
    const blockerId = parseStringField(body, "blockerId");
    const blockedId = parseStringField(body, "blockedId");
    if (!action || !blockerId || !blockedId) {
      return jsonResponse({ error: "action, blockerId, and blockedId are required." }, 400);
    }

    try {
      if (action === "block") {
        const result = await ctx.runMutation(internal.auth.blockUser, { blockerId, blockedId });
        return jsonResponse({ message: "User blocked.", status: result.status });
      }
      if (action === "unblock") {
        const result = await ctx.runMutation(internal.auth.unblockUser, {
          blockerId,
          blockedId,
        });
        return jsonResponse({ message: "User unblocked.", status: result.status });
      }
      return jsonResponse({ error: "Unsupported action. Use block or unblock." }, 400);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update block list.";
      return jsonResponse({ error: message }, 400);
    }
  }),
});

http.route({
  path: "/blcok",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return jsonResponse({ error: "userId is required." }, 400);
    }
    const blocked = await ctx.runQuery(internal.auth.listBlockedUsers, { userId });
    return jsonResponse({ blocked });
  }),
});

http.route({
  path: "/blcok",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }
    const action = parseStringField(body, "action");
    const blockerId = parseStringField(body, "blockerId");
    const blockedId = parseStringField(body, "blockedId");
    if (!action || !blockerId || !blockedId) {
      return jsonResponse({ error: "action, blockerId, and blockedId are required." }, 400);
    }
    if (action === "block") {
      const result = await ctx.runMutation(internal.auth.blockUser, { blockerId, blockedId });
      return jsonResponse({ message: "User blocked.", status: result.status });
    }
    if (action === "unblock") {
      const result = await ctx.runMutation(internal.auth.unblockUser, {
        blockerId,
        blockedId,
      });
      return jsonResponse({ message: "User unblocked.", status: result.status });
    }
    return jsonResponse({ error: "Unsupported action. Use block or unblock." }, 400);
  }),
});

http.route({
  path: "/oauth/google/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const requestUrl = new URL(request.url);
    const oauthError = requestUrl.searchParams.get("error");
    if (oauthError) {
      return Response.redirect(
        frontendRedirect("/login", { error: "google_auth_denied" }),
        302,
      );
    }

    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    if (!code || !state) {
      return Response.redirect(
        frontendRedirect("/login", { error: "google_callback_invalid" }),
        302,
      );
    }

    const oauthState = await ctx.runMutation(internal.auth.consumeOauthState, { state });
    if (!oauthState) {
      return Response.redirect(
        frontendRedirect("/login", { error: "google_state_invalid" }),
        302,
      );
    }

    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!googleClientId || !googleClientSecret) {
        throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: oauthState.redirectUri ?? oauthCallbackUrl(request.url),
        }).toString(),
      });

      if (!tokenRes.ok) {
        throw new Error("Could not exchange Google auth code.");
      }

      const tokenPayload = (await tokenRes.json()) as { access_token?: string };
      const accessToken = tokenPayload.access_token;
      if (!accessToken) {
        throw new Error("Google access token missing.");
      }

      const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userInfoRes.ok) {
        throw new Error("Could not fetch Google user profile.");
      }

      const googleProfile = (await userInfoRes.json()) as {
        email?: string;
        sub?: string;
        name?: string;
      };

      if (!googleProfile.email || !googleProfile.sub) {
        throw new Error("Google profile missing required email or sub fields.");
      }

      const email = googleProfile.email.toLowerCase();
      const fallbackUsername = `${baseUsernameFromEmail(email)}_${randomHex(3)}`;
      const nameBased = googleProfile.name
        ? googleProfile.name.toLowerCase().replace(/[^a-z0-9_]/g, "")
        : null;
      const username = nameBased && nameBased.length > 1 ? nameBased : fallbackUsername;

      const user = await ctx.runMutation(internal.auth.createOrGetGoogleUser, {
        email,
        username,
        googleId: googleProfile.sub,
      });

      const postAuthPath =
        oauthState.flow === "signup" ? "/signup/preferences" : "/dashboard";
      return Response.redirect(
        frontendRedirect(postAuthPath, {
          uid: String(user._id),
          username: user.username,
          email: user.email,
        }),
        302
      );
    } catch {
      const fallbackPath = oauthState.flow === "signup" ? "/signup" : "/login";
      return Response.redirect(
        frontendRedirect(fallbackPath, { error: "google_oauth_failed" }),
        302,
      );
    }
  }),
});

export default http;
