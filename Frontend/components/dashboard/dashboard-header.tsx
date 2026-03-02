"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
<<<<<<< HEAD
import { Calendar, MapPin, Users } from "lucide-react";
=======
import { MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
>>>>>>> 0cfa88b809dcf68ff2c0e7eada208c2b468cf32d
import { cn } from "@/lib/utils";
import { DUMMY_USER_PROFILE } from "@/lib/dashboard/dummy-profile";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: MapPin },
  { href: "/dashboard/upcoming", label: "Upcoming", icon: Calendar },
  { href: "/dashboard/friends", label: "Friends", icon: Users },
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const initials = DUMMY_USER_PROFILE.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onProfilePage = pathname.startsWith("/dashboard/profile");

  return (
    <header className="flex w-full items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2"
        aria-label="Gaucho RSVP Home"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card sm:h-10 sm:w-10">
          <span className="text-base font-bold text-primary sm:text-lg">G</span>
        </div>
        <span className="text-base font-semibold text-foreground sm:text-lg">
          Gaucho RSVP
        </span>
      </Link>

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
            onProfilePage && "border-primary ring-2 ring-primary/40"
          )}
          aria-label="Open profile"
        >
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarImage src={DUMMY_USER_PROFILE.profileImageUrl} alt={DUMMY_USER_PROFILE.name} />
            <AvatarFallback className="text-xs font-semibold text-primary-foreground bg-primary sm:text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </nav>
    </header>
  );
}
