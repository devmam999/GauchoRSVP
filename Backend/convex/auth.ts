import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const createLocalUser = internalMutation({
  args: {
    email: v.string(),
    username: v.string(),
    passwordHash: v.string(),
    passwordSalt: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const username = args.username.trim().toLowerCase();

    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingEmail) {
      throw new Error("Email is already in use.");
    }

    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existingUsername) {
      throw new Error("Username is already in use.");
    }

    const userId = await ctx.db.insert("users", {
      email,
      username,
      authProvider: "local",
      passwordHash: args.passwordHash,
      passwordSalt: args.passwordSalt,
      createdAt: Date.now(),
    });

    return {
      userId,
      email,
      username,
    };
  },
});

export const createOrGetGoogleUser = internalMutation({
  args: {
    email: v.string(),
    username: v.string(),
    googleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const username = args.username.trim().toLowerCase();
    const googleId = args.googleId?.trim() || undefined;

    if (googleId) {
      const existingByGoogleId = await ctx.db
        .query("users")
        .withIndex("by_google_id", (q) => q.eq("googleId", googleId))
        .first();
      if (existingByGoogleId) {
        await ctx.db.patch(existingByGoogleId._id, { lastLoginAt: Date.now() });
        return existingByGoogleId;
      }
    }

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingByEmail) {
      if (existingByEmail.authProvider !== "google") {
        throw new Error("An account with this email already exists with password login.");
      }
      const patch: { googleId?: string; lastLoginAt: number } = {
        lastLoginAt: Date.now(),
      };
      if (googleId && !existingByEmail.googleId) {
        patch.googleId = googleId;
      }
      await ctx.db.patch(existingByEmail._id, patch);
      return {
        ...existingByEmail,
        ...patch,
      };
    }

    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (existingUsername) {
      throw new Error("Username is already in use.");
    }

    const userId = await ctx.db.insert("users", {
      email,
      username,
      authProvider: "google",
      googleId,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    });

    return {
      _id: userId,
      email,
      username,
      authProvider: "google" as const,
      googleId,
    };
  },
});

export const findUserByIdentifier = internalQuery({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identifier = args.identifier.trim().toLowerCase();

    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identifier))
      .first();

    if (byEmail) {
      return byEmail;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identifier))
      .first();
  },
});

export const listUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((user) => ({
        id: user._id,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt ?? null,
      }));
  },
});

export const saveOauthState = internalMutation({
  args: {
    state: v.string(),
    flow: v.union(v.literal("signup"), v.literal("login")),
    redirectUri: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthStates", {
      state: args.state,
      flow: args.flow,
      redirectUri: args.redirectUri,
      createdAt: Date.now(),
    });
  },
});

export const consumeOauthState = internalMutation({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const oauthState = await ctx.db
      .query("oauthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .first();

    if (!oauthState) {
      return null;
    }

    await ctx.db.delete(oauthState._id);
    return {
      flow: oauthState.flow,
      redirectUri: oauthState.redirectUri,
      createdAt: oauthState.createdAt,
    };
  },
});
