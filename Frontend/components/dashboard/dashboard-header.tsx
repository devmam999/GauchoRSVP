"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

export function DashboardHeader() {
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

      <div className="flex items-center gap-2 sm:gap-4">
        <span
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex md:text-sm"
          aria-hidden
        >
          <MapPin className="h-3.5 w-3.5" />
          Dashboard
        </span>
        {/* Placeholder: replace with real user menu when backend auth is ready */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground sm:h-9 sm:w-9"
          aria-label="User menu (placeholder)"
        >
          ?
        </div>
      </div>
    </header>
  );
}
