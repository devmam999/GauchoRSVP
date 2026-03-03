"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Calendar, MapPin, MessageSquare, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DUMMY_USER_PROFILE } from "@/lib/dashboard/dummy-profile";
import {
  type CurrentUser,
  getCurrentUser,
  saveCurrentUser,
} from "@/lib/auth/current-user";
import {
  loadStoredProfileImage,
  subscribeToProfileImageUpdates,
} from "@/lib/auth/profile-image";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: MapPin },
  { href: "/dashboard/upcoming", label: "Upcoming", icon: Calendar },
  { href: "/dashboard/friends", label: "Friends", icon: Users },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
] as const;

export function DashboardHeader() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() =>
    getCurrentUser()
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; message: string; read: boolean; createdAt: number }[]
  >([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    undefined
  );
  const displayName = currentUser?.username ?? DUMMY_USER_PROFILE.name;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onProfilePage = pathname.startsWith("/dashboard/profile");

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setCurrentUser(storedUser);
    }

    const uid = searchParams.get("uid");
    const username = searchParams.get("username");
    const email = searchParams.get("email");

    if (uid && username && email) {
      const nextUser = { id: uid, username, email };
      saveCurrentUser(nextUser);
      setCurrentUser(nextUser);

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("uid");
      cleanUrl.searchParams.delete("username");
      cleanUrl.searchParams.delete("email");
      window.history.replaceState({}, "", cleanUrl.toString());
    }

  }, [searchParams, pathname]);

  useEffect(() => {
    if (!currentUser?.id) {
      setProfileImageUrl(undefined);
      return;
    }

    setProfileImageUrl(loadStoredProfileImage(currentUser.id));
    const unsubscribe = subscribeToProfileImageUpdates(({ userId, value }) => {
      if (userId === currentUser.id) {
        setProfileImageUrl(value);
      }
    });

    return unsubscribe;
  }, [currentUser?.id, pathname]);

  useEffect(() => {
    if (!apiBaseUrl || !currentUser?.id) return;
    let isMounted = true;

    async function loadNotifications() {
      const res = await fetch(
        `${apiBaseUrl}/notifications?userId=${encodeURIComponent(currentUser.id)}`
      );
      const payload = (await res.json()) as {
        notifications?: Array<{
          id: string;
          message: string;
          read: boolean;
          createdAt: number;
        }>;
      };
      if (!res.ok || !isMounted) return;
      setNotifications(payload.notifications ?? []);
    }

    void loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, currentUser?.id, pathname]);

  const handleDeleteNotification = async (notificationId: string) => {
    if (!apiBaseUrl || !currentUser?.id) return;
    const res = await fetch(`${apiBaseUrl}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        userId: currentUser.id,
        notificationId,
      }),
    });
    if (!res.ok) return;
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
  };

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

        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="relative ml-1 gap-1.5 rounded-full border-border bg-card/85 px-3 py-1.5 text-xs font-medium"
            >
              <Bell className="h-3.5 w-3.5" />
              Notifications
              {notifications.length > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {notifications.length}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[min(92vw,25rem)] rounded-2xl border border-border/70 bg-card/95 p-3 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-md"
          >
            <h3 className="mb-2 px-1 text-sm font-semibold text-foreground">
              Notifications
            </h3>
            {notifications.length === 0 ? (
              <p className="rounded-xl border border-border/60 bg-background/40 px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <div
                className={cn(
                  "space-y-2",
                  notifications.length > 5 && "max-h-[20rem] overflow-y-auto pr-1"
                )}
              >
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-sm text-foreground",
                      !notification.read && "border-primary/30"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-2">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-border p-1 text-muted-foreground transition-all duration-200 hover:scale-110 hover:border-destructive/60 hover:text-destructive"
                      onClick={() => handleDeleteNotification(notification.id)}
                      aria-label="Remove notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

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
              src={profileImageUrl}
              alt={displayName}
              className="object-cover"
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
