"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddFriendSearch } from "@/components/dashboard/add-friend-search";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EventCard } from "@/components/dashboard/event-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DUMMY_MY_RSVPED_EVENT_IDS } from "@/lib/dashboard/dummy-friends";
import { DUMMY_EVENTS } from "@/lib/dashboard/dummy-events";
import type { Friend, RegisteredProfile } from "@/lib/dashboard/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { Ban, MessageCircle } from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function FriendCard({
  friend,
  isBlocked,
  onMessage,
  onBlock,
  onUnblock,
  onUnfriend,
}: {
  friend: Friend;
  isBlocked: boolean;
  onMessage: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onUnfriend: () => void;
}) {
  const events = friend.eventIds
    .map((id) => DUMMY_EVENTS.find((e) => e.id === id))
    .filter((e): e is (typeof DUMMY_EVENTS)[number] => e != null);

  if (isBlocked) {
    return (
      <li className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] hover:border-primary/30">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={friend.profileImageUrl} alt={friend.name} />
            <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
              {getInitials(friend.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground truncate">
            {friend.name}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-border transition-all duration-200 hover:scale-105"
          onClick={onUnblock}
        >
          Unblock
        </Button>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex items-center gap-3 sm:flex-col sm:items-start">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
            <AvatarImage src={friend.profileImageUrl} alt={friend.name} />
            <AvatarFallback className="bg-muted text-base font-medium text-foreground sm:text-lg">
              {getInitials(friend.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 sm:mt-0">
            <h2 className="text-lg font-semibold text-foreground">
              {friend.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full border-border transition-all duration-200 hover:scale-105"
                onClick={onMessage}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full border-border text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-muted"
                onClick={onUnfriend}
              >
                Unfriend
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full border-border text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                onClick={onBlock}
              >
                <Ban className="h-3.5 w-3.5" />
                Block
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Events they&apos;re attending
          </h3>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming events
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard
                    event={event}
                    isRsvped={DUMMY_MY_RSVPED_EVENT_IDS.has(event.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [registeredProfiles, setRegisteredProfiles] = useState<RegisteredProfile[]>(
    []
  );
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<
    { id: string; requesterId: string; requesterUsername: string }[]
  >([]);
  const [outgoingRequestUserIds, setOutgoingRequestUserIds] = useState<Set<string>>(
    new Set()
  );
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setProfilesError("No active user session found. Please log in again.");
      setProfilesLoading(false);
      return;
    }
    setCurrentUserId(currentUser.id);
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!apiBaseUrl || !currentUserId) return;
    const activeUserId = currentUserId;

    let isMounted = true;

    async function loadData() {
      try {
        setProfilesLoading(true);
        setProfilesError(null);

        const [usersRes, friendRes, blockedRes] = await Promise.all([
          fetch(`${apiBaseUrl}/friends/registered-users`),
          fetch(`${apiBaseUrl}/friend?userId=${encodeURIComponent(activeUserId)}`),
          fetch(`${apiBaseUrl}/block?userId=${encodeURIComponent(activeUserId)}`),
        ]);

        const usersPayload = (await usersRes.json()) as {
          users?: Array<{ id: string; username: string; email: string }>;
          error?: string;
        };
        const friendPayload = (await friendRes.json()) as {
          friends?: Array<{ id: string; username: string; email: string }>;
          incomingRequests?: Array<{
            id: string;
            requesterId: string;
            requesterUsername: string;
          }>;
          outgoingRequestUserIds?: string[];
          error?: string;
        };
        const blockedPayload = (await blockedRes.json()) as {
          blocked?: Array<{ blockedId: string }>;
          error?: string;
        };

        if (!usersRes.ok) {
          throw new Error(usersPayload.error ?? "Could not fetch users.");
        }
        if (!friendRes.ok) {
          throw new Error(friendPayload.error ?? "Could not fetch friends.");
        }
        if (!blockedRes.ok) {
          throw new Error(blockedPayload.error ?? "Could not fetch blocked users.");
        }

        if (!isMounted) return;

        setRegisteredProfiles(
          (usersPayload.users ?? [])
            .filter((user) => user.id !== activeUserId)
            .map((user) => ({
              id: user.id,
              name: user.username || user.email,
            }))
        );

        setFriends(
          (friendPayload.friends ?? []).map((user) => ({
            id: user.id,
            name: user.username || user.email,
            eventIds: [],
          }))
        );
        setIncomingRequests(friendPayload.incomingRequests ?? []);
        setOutgoingRequestUserIds(
          new Set(friendPayload.outgoingRequestUserIds ?? [])
        );
        setBlockedIds(new Set((blockedPayload.blocked ?? []).map((entry) => entry.blockedId)));
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error ? error.message : "Could not load friend data.";
        setProfilesError(message);
      } finally {
        if (isMounted) {
          setProfilesLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, currentUserId]);

  const allFriends: Friend[] = friends;
  const existingFriendIds = useMemo(
    () => new Set(allFriends.map((f) => f.id)),
    [allFriends]
  );
  const activeFriends = allFriends.filter((f) => !blockedIds.has(f.id));
  const blockedFriends = allFriends.filter((f) => blockedIds.has(f.id));

  const handleBlock = async (friendId: string) => {
    if (!apiBaseUrl || !currentUserId) return;
    const res = await fetch(`${apiBaseUrl}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "block",
        blockerId: currentUserId,
        blockedId: friendId,
      }),
    });
    if (!res.ok) {
      return;
    }
    setBlockedIds((prev) => new Set(prev).add(friendId));
  };

  const handleUnblock = async (friendId: string) => {
    if (!apiBaseUrl || !currentUserId) return;
    const res = await fetch(`${apiBaseUrl}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "unblock",
        blockerId: currentUserId,
        blockedId: friendId,
      }),
    });
    if (!res.ok) {
      return;
    }
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(friendId);
      return next;
    });
  };

  const handleUnfriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  const refreshFriendContext = async () => {
    if (!apiBaseUrl || !currentUserId) return;
    const res = await fetch(`${apiBaseUrl}/friend?userId=${currentUserId}`);
    const payload = (await res.json()) as {
      friends?: Array<{ id: string; username: string; email: string }>;
      incomingRequests?: Array<{
        id: string;
        requesterId: string;
        requesterUsername: string;
      }>;
      outgoingRequestUserIds?: string[];
      error?: string;
    };
    if (!res.ok) {
      throw new Error(payload.error ?? "Could not refresh friend context.");
    }
    setFriends(
      (payload.friends ?? []).map((user) => ({
        id: user.id,
        name: user.username || user.email,
        eventIds: [],
      }))
    );
    setIncomingRequests(payload.incomingRequests ?? []);
    setOutgoingRequestUserIds(new Set(payload.outgoingRequestUserIds ?? []));
  };

  const handleAddFromSearch = async (profile: RegisteredProfile) => {
    if (existingFriendIds.has(profile.id)) return;
    if (!apiBaseUrl || !currentUserId) return;

    const res = await fetch(`${apiBaseUrl}/friend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request",
        requesterId: currentUserId,
        addresseeId: profile.id,
      }),
    });
    const payload = (await res.json()) as {
      error?: string;
      status?: "pending" | "accepted";
    };
    if (!res.ok) {
      setProfilesError(payload.error ?? "Could not send friend request.");
      return;
    }

    if (payload.status === "pending") {
      const notifyRes = await fetch(`${apiBaseUrl}/friend/notify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUserId,
          addresseeId: profile.id,
        }),
      });
      const notifyPayload = (await notifyRes.json()) as { error?: string };
      if (!notifyRes.ok) {
        setProfilesError(
          notifyPayload.error ??
            "Friend request sent, but email notification could not be delivered."
        );
      }
    }

    await refreshFriendContext();
  };

  const handleIncomingRequest = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    if (!apiBaseUrl || !currentUserId) return;
    const res = await fetch(`${apiBaseUrl}/friend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        requestId,
        responderId: currentUserId,
      }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      setProfilesError(payload.error ?? "Could not respond to friend request.");
      return;
    }

    await refreshFriendContext();
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_40%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_38%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_35%)]" />
      <DashboardHeader />

      <main className="relative z-10 flex-1 overflow-auto px-4 py-6 sm:px-6">
        <h1 className="mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Friends
        </h1>

        <section aria-label="Add friend" className="mb-8 w-full">
          <AddFriendSearch
            profiles={registeredProfiles}
            existingFriendIds={existingFriendIds}
            onAdd={handleAddFromSearch}
            pendingRequestIds={outgoingRequestUserIds}
          />
          {profilesLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Loading registered users...
            </p>
          ) : null}
          {profilesError ? (
            <ErrorNotice
              className="mt-2"
              title="Friends page issue"
              message={profilesError}
              onDismiss={() => setProfilesError(null)}
            />
          ) : null}
        </section>

        <ScrollArea className="h-[calc(100dvh-16rem)]">
          <div className="space-y-8 pb-8">
            {incomingRequests.length > 0 && (
              <section aria-label="Friend requests">
                <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Incoming Requests ({incomingRequests.length})
                </h2>
                <ul className="space-y-2">
                  {incomingRequests.map((request) => (
                    <li
                      key={request.id}
                      className="flex items-center justify-between rounded-xl border border-primary/25 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-[1.01]"
                    >
                      <span className="text-sm text-foreground">
                        {request.requesterUsername} sent you a friend request.
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-full transition-all duration-200 hover:scale-105"
                          onClick={() =>
                            handleIncomingRequest(request.id, "accept")
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full transition-all duration-200 hover:scale-105"
                          onClick={() =>
                            handleIncomingRequest(request.id, "reject")
                          }
                        >
                          Decline
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Friends list */}
            <section aria-label="Friends">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Friends ({activeFriends.length})
              </h2>
              {activeFriends.length === 0 ? (
                <p className="rounded-xl border border-border/70 bg-card/80 py-12 text-center text-muted-foreground shadow-sm backdrop-blur-sm">
                  No friends yet. Search above to add someone on Gaucho RSVP
                </p>
              ) : (
                <ul className="space-y-6">
                  {activeFriends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      isBlocked={false}
                      onMessage={() => router.push(`/dashboard/messages?userId=${friend.id}`)}
                      onBlock={() => handleBlock(friend.id)}
                      onUnblock={() => handleUnblock(friend.id)}
                      onUnfriend={() => handleUnfriend(friend.id)}
                    />
                  ))}
                </ul>
              )}
            </section>

            {/* Blocked list */}
            {blockedFriends.length > 0 && (
              <section aria-label="Blocked">
                <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Blocked ({blockedFriends.length})
                </h2>
                <ul className="space-y-2">
                  {blockedFriends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      isBlocked
                      onMessage={() => router.push(`/dashboard/messages?userId=${friend.id}`)}
                      onBlock={() => handleBlock(friend.id)}
                      onUnblock={() => handleUnblock(friend.id)}
                      onUnfriend={() => handleUnfriend(friend.id)}
                    />
                  ))}
                </ul>
              </section>
            )}

          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
