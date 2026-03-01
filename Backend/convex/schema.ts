import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    username: v.string(),
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
});
