import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
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
      const emailVerified =
        existingEmail.emailVerified ?? existingEmail.authProvider === "google";
      // Allow re-attempting signup for unverified local accounts.
      if (!emailVerified && existingEmail.authProvider === "local") {
        if (existingEmail.username !== username) {
          const conflictingUsername = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", username))
            .first();
          if (
            conflictingUsername &&
            conflictingUsername._id !== existingEmail._id
          ) {
            return { kind: "username_in_use" as const };
          }
        }

        await ctx.db.patch(existingEmail._id, {
          username,
          passwordHash: args.passwordHash,
          passwordSalt: args.passwordSalt,
          emailVerified: false,
        });

        return {
          kind: "updated_unverified" as const,
          userId: existingEmail._id,
          email,
          username,
        };
      }

      return { kind: "email_in_use" as const };
    }

    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existingUsername) {
      return { kind: "username_in_use" as const };
    }

    const userId = await ctx.db.insert("users", {
      email,
      username,
      emailVerified: false,
      authProvider: "local",
      passwordHash: args.passwordHash,
      passwordSalt: args.passwordSalt,
      createdAt: Date.now(),
    });

    return {
      kind: "created" as const,
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
      if (!existingByEmail.emailVerified) {
        await ctx.db.patch(existingByEmail._id, { emailVerified: true });
      }
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
      emailVerified: true,
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
        emailVerified: user.emailVerified ?? user.authProvider === "google",
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt ?? null,
      }));
  },
});

export const getUserById = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as Id<"users">);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified ?? user.authProvider === "google",
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt ?? null,
    };
  },
});

export const createEmailVerificationCode = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailVerificationCodes", {
      userId: args.userId,
      email: args.email.trim().toLowerCase(),
      code: args.code,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});

export const verifyEmailCode = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const code = args.code.trim();

    const candidates = await ctx.db
      .query("emailVerificationCodes")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .collect();

    const now = Date.now();
    const latestValid = candidates
      .sort((a, b) => b.createdAt - a.createdAt)
      .find(
        (entry) =>
          !entry.consumedAt && entry.code === code && entry.expiresAt > now
      );

    if (!latestValid) {
      throw new Error("Invalid or expired verification code.");
    }

    await ctx.db.patch(latestValid._id, { consumedAt: now });
    await ctx.db.patch(latestValid.userId as Id<"users">, { emailVerified: true });

    const user = await ctx.db.get(latestValid.userId as Id<"users">);
    if (!user) {
      throw new Error("User not found after verification.");
    }

    return {
      id: user._id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified ?? user.authProvider === "google",
    };
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

export const sendFriendRequest = internalMutation({
  args: {
    requesterId: v.string(),
    addresseeId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.requesterId === args.addresseeId) {
      throw new Error("You cannot send a friend request to yourself.");
    }

    const byRequester = await ctx.db
      .query("friendRequests")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.requesterId))
      .collect();
    const byAddressee = await ctx.db
      .query("friendRequests")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", args.requesterId))
      .collect();

    const existing = [...byRequester, ...byAddressee].find(
      (request) =>
        (request.requesterId === args.requesterId &&
          request.addresseeId === args.addresseeId) ||
        (request.requesterId === args.addresseeId &&
          request.addresseeId === args.requesterId)
    );

    if (existing?.status === "accepted") {
      throw new Error("You are already friends.");
    }

    if (
      existing &&
      existing.status === "pending" &&
      existing.requesterId === args.requesterId
    ) {
      throw new Error("Friend request already sent.");
    }

    if (
      existing &&
      existing.status === "pending" &&
      existing.requesterId === args.addresseeId
    ) {
      await ctx.db.patch(existing._id, {
        status: "accepted",
        updatedAt: Date.now(),
      });

      await ctx.db.insert("notifications", {
        userId: args.addresseeId,
        actorId: args.requesterId,
        type: "friend_request_accepted",
        message: "Your friend request was accepted.",
        requestId: existing._id,
        read: false,
        createdAt: Date.now(),
      });

      return {
        requestId: existing._id,
        status: "accepted" as const,
      };
    }

    const requestId = await ctx.db.insert("friendRequests", {
      requesterId: args.requesterId,
      addresseeId: args.addresseeId,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: args.addresseeId,
      actorId: args.requesterId,
      type: "friend_request",
      message: "You have a new friend request.",
      requestId,
      read: false,
      createdAt: Date.now(),
    });

    return {
      requestId,
      status: "pending" as const,
    };
  },
});

export const respondToFriendRequest = internalMutation({
  args: {
    requestId: v.string(),
    responderId: v.string(),
    action: v.union(v.literal("accept"), v.literal("reject")),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId as Id<"friendRequests">);
    if (!request) {
      throw new Error("Friend request not found.");
    }
    if (request.addresseeId !== args.responderId) {
      throw new Error("You can only respond to requests sent to you.");
    }
    if (request.status !== "pending") {
      throw new Error("This friend request is no longer pending.");
    }

    const status = args.action === "accept" ? "accepted" : "rejected";
    await ctx.db.patch(request._id, {
      status,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: request.requesterId,
      actorId: args.responderId,
      type:
        status === "accepted"
          ? "friend_request_accepted"
          : "friend_request_rejected",
      message:
        status === "accepted"
          ? "Your friend request was accepted."
          : "Your friend request was rejected.",
      requestId: request._id,
      read: false,
      createdAt: Date.now(),
    });

    return {
      requestId: request._id,
      status,
    };
  },
});

export const getFriendContext = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const outgoing = await ctx.db
      .query("friendRequests")
      .withIndex("by_requester", (q) => q.eq("requesterId", args.userId))
      .collect();
    const incoming = await ctx.db
      .query("friendRequests")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", args.userId))
      .collect();

    const accepted = [...outgoing, ...incoming].filter(
      (request) => request.status === "accepted"
    );
    const incomingPending = incoming.filter((request) => request.status === "pending");
    const outgoingPending = outgoing.filter((request) => request.status === "pending");

    const friendIds = new Set<string>();
    for (const request of accepted) {
      if (request.requesterId === args.userId) {
        friendIds.add(request.addresseeId);
      } else {
        friendIds.add(request.requesterId);
      }
    }

    const users = await ctx.db.query("users").collect();
    const userById = new Map(users.map((user) => [user._id as string, user]));

    const friends = Array.from(friendIds)
      .map((id) => userById.get(id))
      .filter((user): user is (typeof users)[number] => user !== undefined)
      .map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
      }));

    const incomingRequests = incomingPending
      .map((request) => ({
        id: request._id,
        requesterId: request.requesterId,
        requesterUsername: userById.get(request.requesterId)?.username ?? "Unknown",
      }))
      .sort((a, b) => (a.id > b.id ? -1 : 1));

    return {
      friends,
      incomingRequests,
      outgoingRequestUserIds: outgoingPending.map((request) => request.addresseeId),
    };
  },
});

export const listNotifications = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return notifications
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((notification) => ({
        id: notification._id,
        type: notification.type,
        message: notification.message,
        actorId: notification.actorId ?? null,
        requestId: notification.requestId ?? null,
        read: notification.read,
        createdAt: notification.createdAt,
      }));
  },
});

export const markAllNotificationsRead = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(
      notifications
        .filter((notification) => !notification.read)
        .map((notification) => ctx.db.patch(notification._id, { read: true }))
    );
  },
});

export const deleteNotification = internalMutation({
  args: {
    userId: v.string(),
    notificationId: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(
      args.notificationId as Id<"notifications">
    );
    if (!notification) {
      throw new Error("Notification not found.");
    }
    if (notification.userId !== args.userId) {
      throw new Error("You can only delete your own notifications.");
    }

    await ctx.db.delete(notification._id);
  },
});

export const sendMessage = internalMutation({
  args: {
    senderId: v.string(),
    recipientId: v.string(),
    text: v.optional(v.string()),
    imageStorageId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.senderId === args.recipientId) {
      throw new Error("You cannot message yourself.");
    }

    const senderBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.senderId))
      .collect();
    if (senderBlocks.some((entry) => entry.blockedId === args.recipientId)) {
      throw new Error("You blocked this user. Unblock them before messaging.");
    }

    const recipientBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.recipientId))
      .collect();
    if (recipientBlocks.some((entry) => entry.blockedId === args.senderId)) {
      throw new Error("You cannot message this user.");
    }

    const trimmedText = args.text?.trim();
    if (!trimmedText && !args.imageUrl) {
      throw new Error("Message text or image is required.");
    }

    const messageId = await ctx.db.insert("messages", {
      senderId: args.senderId,
      recipientId: args.recipientId,
      text: trimmedText || undefined,
      imageStorageId: args.imageStorageId,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: args.recipientId,
      actorId: args.senderId,
      type: "message_received",
      message: "You received a new message.",
      read: false,
      createdAt: Date.now(),
    });

    return { messageId };
  },
});

export const listMessageThreads = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const sent = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", args.userId))
      .collect();
    const received = await ctx.db
      .query("messages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.userId))
      .collect();

    const latestByOtherUser = new Map<
      string,
      (typeof sent)[number] | (typeof received)[number]
    >();

    for (const message of [...sent, ...received]) {
      const otherUserId =
        message.senderId === args.userId ? message.recipientId : message.senderId;
      const existing = latestByOtherUser.get(otherUserId);
      if (!existing || message.createdAt > existing.createdAt) {
        latestByOtherUser.set(otherUserId, message);
      }
    }

    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    return Array.from(latestByOtherUser.entries())
      .map(([otherUserId, message]) => {
        const otherUser = userMap.get(otherUserId);
        return {
          userId: otherUserId,
          username: otherUser?.username ?? "Unknown",
          email: otherUser?.email ?? "",
          lastMessage: message.text ?? (message.imageUrl ? "[Image]" : ""),
          lastMessageAt: message.createdAt,
        };
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

export const getConversation = internalQuery({
  args: {
    userId: v.string(),
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const sentByUser = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", args.userId))
      .collect();
    const sentByOther = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", args.otherUserId))
      .collect();

    return [...sentByUser, ...sentByOther]
      .filter(
        (message) =>
          (message.senderId === args.userId &&
            message.recipientId === args.otherUserId) ||
          (message.senderId === args.otherUserId &&
            message.recipientId === args.userId)
      )
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((message) => ({
        id: message._id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        text: message.text ?? "",
        imageUrl: message.imageUrl ?? null,
        createdAt: message.createdAt,
      }));
  },
});

export const blockUser = internalMutation({
  args: {
    blockerId: v.string(),
    blockedId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.blockerId === args.blockedId) {
      throw new Error("You cannot block yourself.");
    }

    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.blockerId))
      .collect();
    if (existing.some((entry) => entry.blockedId === args.blockedId)) {
      return { status: "already_blocked" as const };
    }

    await ctx.db.insert("blocks", {
      blockerId: args.blockerId,
      blockedId: args.blockedId,
      createdAt: Date.now(),
    });

    return { status: "blocked" as const };
  },
});

export const unblockUser = internalMutation({
  args: {
    blockerId: v.string(),
    blockedId: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.blockerId))
      .collect();

    const target = entries.find((entry) => entry.blockedId === args.blockedId);
    if (!target) {
      return { status: "not_blocked" as const };
    }

    await ctx.db.delete(target._id);
    return { status: "unblocked" as const };
  },
});

export const listBlockedUsers = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const blockedEntries = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.userId))
      .collect();

    return blockedEntries.map((entry) => ({
      blockedId: entry.blockedId,
      createdAt: entry.createdAt,
    }));
  },
});
