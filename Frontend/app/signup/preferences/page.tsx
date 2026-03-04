"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RankingList } from "@/components/ranking-list";
import { getCurrentUser, saveCurrentUser } from "@/lib/auth/current-user";

export default function PreferencesPage() {
  const searchParams = useSearchParams();

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

  const currentUser = getCurrentUser();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[url('/ucsb-night.png')] bg-cover bg-center bg-no-repeat" />
      <div className="pointer-events-none absolute inset-0 bg-black/62" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.20),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_40%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.14),transparent_35%)]" />
      <div className="animate-fade-in relative z-10 flex w-full max-w-md flex-col items-center gap-8 rounded-3xl border border-border/60 bg-card/55 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tell us about{" "}
            <span className="text-primary">you</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a little info and rank these 4 event topics.
          </p>
          {currentUser ? (
            <p className="text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{currentUser.email}</span>
            </p>
          ) : null}
        </div>

        <RankingList />
      </div>
    </main>
  );
}
