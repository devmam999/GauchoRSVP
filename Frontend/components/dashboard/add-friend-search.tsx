"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RegisteredProfile } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { Search, UserPlus } from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface AddFriendSearchProps {
  /** All registered profiles to search (e.g. from API) */
  profiles: RegisteredProfile[];
  /** Ids of users already friends (don't show in results) */
  existingFriendIds: Set<string>;
  /** Called when user selects a profile to add */
  onAdd: (profile: RegisteredProfile) => void;
  /** Ids with a pending outgoing friend request */
  pendingRequestIds?: Set<string>;
  className?: string;
}

export function AddFriendSearch({
  profiles,
  existingFriendIds,
  onAdd,
  pendingRequestIds,
  className,
}: AddFriendSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = query.trim().length > 0
    ? profiles.filter(
        (p) =>
          !existingFriendIds.has(p.id) &&
          p.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn("relative z-50", className)}>
    <Card
      className={cn(
        "overflow-visible border-border/70 bg-gradient-to-r from-card/90 via-card/70 to-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-300 focus-within:scale-[1.01] focus-within:border-primary/50"
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1 sm:min-w-[12rem]">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserPlus className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium text-foreground">Add friend</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search by name to find someone on Gaucho RSVP
            </p>
          </div>
          <div className="relative w-full sm:flex-1 sm:min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => query.trim() && setIsOpen(true)}
            className="pl-9 rounded-lg border-border/80 bg-background/70 transition-all duration-200 focus-visible:scale-[1.01] focus-visible:border-primary/60"
            aria-label="Search for a friend"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
          />
          {showDropdown && (
            <ul
              role="listbox"
              className="absolute top-full left-0 right-0 z-30 mt-1 max-h-[11rem] overflow-y-auto overflow-x-hidden rounded-lg border border-border/70 bg-card/95 py-1 shadow-xl backdrop-blur"
            >
              {matches.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted-foreground">
                  No one found. Try a different name.
                </li>
              ) : (
                matches.map((profile) => (
                  <li key={profile.id} role="option">
                    <div className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors duration-200 hover:bg-muted/80">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={profile.profileImageUrl} alt={profile.name} />
                        <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground truncate flex-1">
                        {profile.name}
                      </span>
                      <button
                        type="button"
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                          pendingRequestIds?.has(profile.id)
                            ? "cursor-not-allowed border-border text-muted-foreground"
                            : "cursor-pointer border-primary/40 text-primary hover:scale-105 hover:bg-primary/10"
                        )}
                        disabled={pendingRequestIds?.has(profile.id)}
                        onClick={() => {
                          onAdd(profile);
                          setQuery("");
                          setIsOpen(false);
                        }}
                      >
                        {pendingRequestIds?.has(profile.id)
                          ? "Requested"
                          : "Add friend"}
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
