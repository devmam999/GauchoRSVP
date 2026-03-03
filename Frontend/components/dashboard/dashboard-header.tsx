"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, MessageSquare, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { DUMMY_USER_PROFILE } from "@/lib/dashboard/dummy-profile";
import { getCurrentUser, saveCurrentUser } from "@/lib/auth/current-user";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: MapPin },
  { href: "/dashboard/upcoming", label: "Upcoming", icon: Calendar },
  { href: "/dashboard/friends", label: "Friends", icon: Users },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useMemo(() => getCurrentUser(), [searchParams, pathname]);
  const displayName = currentUser?.username ?? DUMMY_USER_PROFILE.name;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onProfilePage = pathname.startsWith("/dashboard/profile");

  useEffect(() => {
    const uid = searchParams.get("uid");
    const username = searchParams.get("username");
    const email = searchParams.get("email");

    if (uid && username && email) {
      saveCurrentUser({ id: uid, username, email });

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("uid");
      cleanUrl.searchParams.delete("username");
      cleanUrl.searchParams.delete("email");
      window.history.replaceState({}, "", cleanUrl.toString());
    }
  }, [searchParams]);

  const handleBrandClick = () => {
    const currentUser = getCurrentUser();
    router.push(currentUser ? "/dashboard" : "/");
  };

  return (
    <header className="relative z-20 flex w-full items-center justify-between gap-4 border-b border-border/70 bg-card/55 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={handleBrandClick}
        className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 transition-all duration-200 hover:scale-[1.02]"
        aria-label="Gaucho RSVP Home"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card sm:h-10 sm:w-10">
          <span className="text-base font-bold text-primary sm:text-lg">G</span>
        </div>
        <span className="text-base font-semibold text-foreground sm:text-lg">
          Gaucho RSVP
        </span>
      </button>

      <nav className="flex items-center gap-2 sm:gap-3" aria-label="Dashboard navigation">
        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors sm:px-4 md:text-sm",
                  "duration-200 hover:scale-[1.03]",
                  isActive
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/dashboard/profile"
          className={cn(
            "ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-medium sm:h-9 sm:w-9",
            "transition-all duration-200 hover:scale-110",
            onProfilePage && "border-primary ring-2 ring-primary/40"
          )}
          aria-label="Open profile"
        >
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarImage
              src={DUMMY_USER_PROFILE.profileImageUrl}
              alt={displayName}
            />
            <AvatarFallback className="text-xs font-semibold text-primary-foreground bg-primary sm:text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </nav>
    </header>
  );
}
