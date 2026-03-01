"use client";

import { useState, useMemo } from "react";
import { AddFriendSearch } from "@/components/dashboard/add-friend-search";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EventCard } from "@/components/dashboard/event-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DUMMY_FRIENDS,
  DUMMY_MY_RSVPED_EVENT_IDS,
  DUMMY_REGISTERED_PROFILES,
} from "@/lib/dashboard/dummy-friends";
import { DUMMY_EVENTS } from "@/lib/dashboard/dummy-events";
import type { Friend, RegisteredProfile } from "@/lib/dashboard/types";
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
  onBlock,
  onUnblock,
  onUnfriend,
}: {
  friend: Friend;
  isBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onUnfriend: () => void;
}) {
  const events = friend.eventIds
    .map((id) => DUMMY_EVENTS.find((e) => e.id === id))
    .filter((e): e is (typeof DUMMY_EVENTS)[number] => e != null);

  if (isBlocked) {
    return (
      <li className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
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
          className="shrink-0 rounded-full border-border"
          onClick={onUnblock}
        >
          Unblock
        </Button>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
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
                className="gap-1.5 rounded-full border-border"
                onClick={() => {
                  /* TODO: open message thread when backend ready */
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full border-border text-muted-foreground hover:bg-muted"
                onClick={onUnfriend}
              >
                Unfriend
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
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
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [unfriendedIds, setUnfriendedIds] = useState<Set<string>>(new Set());
  const [addedFriends, setAddedFriends] = useState<Friend[]>([]);

  const allFriends: Friend[] = [
    ...DUMMY_FRIENDS.filter((f) => !unfriendedIds.has(f.id)),
    ...addedFriends.filter((f) => !unfriendedIds.has(f.id)),
  ];
  const existingFriendIds = useMemo(
    () => new Set(allFriends.map((f) => f.id)),
    [allFriends]
  );
  const activeFriends = allFriends.filter((f) => !blockedIds.has(f.id));
  const blockedFriends = allFriends.filter((f) => blockedIds.has(f.id));

  const handleBlock = (friendId: string) => {
    setBlockedIds((prev) => new Set(prev).add(friendId));
  };

  const handleUnblock = (friendId: string) => {
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(friendId);
      return next;
    });
  };

  const handleUnfriend = (friendId: string) => {
    setUnfriendedIds((prev) => new Set(prev).add(friendId));
    setAddedFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  const handleAddFromSearch = (profile: RegisteredProfile) => {
    if (existingFriendIds.has(profile.id)) return;
    setUnfriendedIds((prev) => {
      const next = new Set(prev);
      next.delete(profile.id);
      return next;
    });
    setAddedFriends((prev) => [
      ...prev,
      {
        id: profile.id,
        name: profile.name,
        profileImageUrl: profile.profileImageUrl,
        eventIds: [],
      },
    ]);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Friends
        </h1>

        <section aria-label="Add friend" className="mb-8 w-full">
          <AddFriendSearch
            profiles={DUMMY_REGISTERED_PROFILES}
            existingFriendIds={existingFriendIds}
            onAdd={handleAddFromSearch}
          />
        </section>

        <ScrollArea className="h-[calc(100dvh-16rem)]">
          <div className="space-y-8 pb-8">
            {/* Friends list */}
            <section aria-label="Friends">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Friends ({activeFriends.length})
              </h2>
              {activeFriends.length === 0 ? (
                <p className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
                  No friends yet. Search above to add someone on Gaucho RSVP, or
                  unblock someone below.
                </p>
              ) : (
                <ul className="space-y-6">
                  {activeFriends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      isBlocked={false}
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
