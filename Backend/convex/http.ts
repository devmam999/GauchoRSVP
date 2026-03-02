import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

declare const process: {
  env: Record<string, string | undefined>;
};

const http = httpRouter();

type JsonRecord = Record<string, unknown>;
type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

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

async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS ?? "Gaucho RSVP <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Missing RESEND_API_KEY. Set it with `npx convex env set RESEND_API_KEY ...`.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    return {
      ok: false,
      error: `Email provider error: ${errBody}`,
    };
  }

  return { ok: true as const };
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

      const verificationCode = String(
        Math.floor(100000 + Math.random() * 900000)
      );
      const expiresAt = Date.now() + 15 * 60 * 1000;
      await ctx.runMutation(internal.auth.createEmailVerificationCode, {
        userId: String(user.userId),
        email,
        code: verificationCode,
        expiresAt,
      });

      const emailDelivery = await sendEmail({
        to: email,
        subject: "Verify your Gaucho RSVP account",
        text: `Your verification code is ${verificationCode}. It expires in 15 minutes.`,
        html: `<p>Your verification code is <strong>${verificationCode}</strong>.</p><p>It expires in 15 minutes.</p>`,
      });

      return jsonResponse(
        {
          message:
            user.kind === "updated_unverified"
              ? "Signup details refreshed. Verify your email with the new code."
              : "Signup successful.",
          requiresEmailVerification: true,
          verificationEmailSent: emailDelivery.ok,
          emailDeliveryError: emailDelivery.ok ? null : emailDelivery.error,
          user: {
            id: user.userId,
            email: user.email,
            username: user.username,
            authProvider: "local",
            emailVerified: false,
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
    const isEmailVerified = user.emailVerified ?? user.authProvider === "google";
    if (!isEmailVerified) {
      return jsonResponse(
        {
          error:
            "Email not verified. Please verify your email with the code we sent before logging in.",
        },
        403
      );
    }

    return jsonResponse({
      message: "Login successful.",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        emailVerified: isEmailVerified,
      },
    });
  }),
});

http.route({
  path: "/verify-email",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const email = parseStringField(body, "email");
    const code = parseStringField(body, "code");
    if (!email || !code) {
      return jsonResponse({ error: "email and code are required." }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse({ error: "Please enter a valid email address." }, 400);
    }

    try {
      const user = await ctx.runMutation(internal.auth.verifyEmailCode, {
        email,
        code,
      });
      return jsonResponse({
        message: "Email verified successfully.",
        user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not verify email.";
      return jsonResponse({ error: message }, 400);
    }
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
  handler: httpAction(async (ctx, request) => {
    let body: JsonRecord;
    try {
      body = (await request.json()) as JsonRecord;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    const requesterId = parseStringField(body, "requesterId");
    const addresseeId = parseStringField(body, "addresseeId");
    if (!requesterId || !addresseeId) {
      return jsonResponse(
        { error: "requesterId and addresseeId are required." },
        400
      );
    }

    const requester = await ctx.runQuery(internal.auth.getUserById, {
      userId: requesterId,
    });
    const addressee = await ctx.runQuery(internal.auth.getUserById, {
      userId: addresseeId,
    });

    if (!requester || !addressee) {
      return jsonResponse({ error: "Requester or addressee not found." }, 404);
    }

    if (!addressee.emailVerified) {
      return jsonResponse(
        { error: "Target user email is not verified. No email notification sent." },
        400
      );
    }

    const friendRequestEmail = await sendEmail({
      to: addressee.email,
      subject: "You have a new Gaucho RSVP friend request",
      text: `${requester.username} sent you a friend request on Gaucho RSVP.`,
      html: `<p><strong>${requester.username}</strong> sent you a friend request on Gaucho RSVP.</p>`,
    });

    if (!friendRequestEmail.ok) {
      return jsonResponse({ error: friendRequestEmail.error }, 400);
    }

    return jsonResponse({ message: "Friend request email sent." });
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

      return Response.redirect(
        frontendRedirect("/dashboard", {
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
