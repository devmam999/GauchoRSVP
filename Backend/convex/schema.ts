import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    username: v.string(),
    emailVerified: v.optional(v.boolean()),
    authProvider: v.union(v.literal("local"), v.literal("google")),
    googleId: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_google_id", ["googleId"])
    .index("by_username", ["username"]),
  oauthStates: defineTable({
    state: v.string(),
    flow: v.union(v.literal("signup"), v.literal("login")),
    redirectUri: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_state", ["state"]),
  emailVerificationCodes: defineTable({
    userId: v.string(),
    email: v.string(),
    code: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),
  friendRequests: defineTable({
    requesterId: v.string(),
    addresseeId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("canceled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_requester", ["requesterId"])
    .index("by_addressee", ["addresseeId"]),
  notifications: defineTable({
    userId: v.string(),
    actorId: v.optional(v.string()),
    type: v.union(
      v.literal("friend_request"),
      v.literal("friend_request_accepted"),
      v.literal("friend_request_rejected")
    ),
    message: v.string(),
    requestId: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
