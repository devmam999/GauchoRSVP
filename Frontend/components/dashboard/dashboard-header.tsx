"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: MapPin },
  { href: "/dashboard/friends", label: "Friends", icon: Users },
] as const;

export function DashboardHeader() {
  const pathname = usePathname();

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

      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Dashboard navigation">
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
        {/* Placeholder: replace with real user menu when backend auth is ready */}
        <div
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground sm:h-9 sm:w-9"
          aria-label="User menu (placeholder)"
        >
          ?
        </div>
      </nav>
    </header>
  );
}
