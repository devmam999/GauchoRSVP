'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorNotice } from "@/components/ui/error-notice";
import { clearCurrentUser, getCurrentUser } from "@/lib/auth/current-user";
import { EVENT_CATEGORIES, type UserProfile } from "@/lib/dashboard/types";

function buildDefaultProfile(params: {
  id: string;
  username: string;
  email: string;
}): UserProfile {
  return {
    id: params.id,
    name: params.username,
    username: params.username,
    email: params.email,
    profileImageUrl: undefined,
    major: "",
    year: "",
    bio: "",
    homeBase: "",
    preferredEventTypes: [],
    notificationPreferences: {
      emailEvents: true,
      emailReminders: true,
      emailFriendActivity: true,
    },
  };
}

export default function ProfileClient() {
  const router = useRouter();
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setLoadError("No active user session found. Please log in again.");
      return;
    }
    if (!apiBaseUrl) {
      setLoadError("Missing NEXT_PUBLIC_CONVEX_HTTP_URL in frontend environment.");
      return;
    }

    let isMounted = true;
    async function loadProfile() {
      try {
        const res = await fetch(
          `${apiBaseUrl}/user?userId=${encodeURIComponent(currentUser.id)}`
        );
        const payload = (await res.json()) as {
          user?: { id: string; username: string; email: string };
          error?: string;
        };
        if (!res.ok || !payload.user) {
          throw new Error(payload.error ?? "Could not load user profile.");
        }
        if (!isMounted) return;
        setProfile(
          buildDefaultProfile({
            id: payload.user.id,
            username: payload.user.username,
            email: payload.user.email,
          })
        );
      } catch (error) {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load user profile."
        );
      }
    }

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  if (loadError) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <ErrorNotice
            title="Profile load issue"
            message={loadError}
            onDismiss={() => setLoadError(null)}
            className="px-4 py-4"
          />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          Loading profile...
        </div>
      </main>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage src={profile.profileImageUrl} alt={profile.name} />
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {profile.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
              {profile.major && profile.year && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.year} · {profile.major}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 sm:items-end">
            <div className="flex flex-wrap justify-end gap-2">
              {profile.homeBase && (
                <Badge variant="outline" className="text-xs">
                  Home base: {profile.homeBase}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Gaucho RSVP member
              </Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-border text-xs sm:text-sm"
              onClick={() => setIsEditing((prev) => !prev)}
            >
              {isEditing ? "Done editing" : "Edit profile"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-full text-xs sm:text-sm"
              onClick={() => {
                clearCurrentUser();
                router.push("/");
              }}
            >
              Log out
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Profile details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{profile.email}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Major</p>
                  {isEditing ? (
                    <Input
                      value={profile.major ?? ""}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          major: e.target.value,
                        }))
                      }
                      placeholder="Your major"
                      className="mt-1 h-9"
                    />
                  ) : (
                    <p className="font-medium text-foreground">
                      {profile.major ?? "Not set"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Year</p>
                  {isEditing ? (
                    <Input
                      value={profile.year ?? ""}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          year: e.target.value,
                        }))
                      }
                      placeholder="e.g. 3rd Year"
                      className="mt-1 h-9"
                    />
                  ) : (
                    <p className="font-medium text-foreground">
                      {profile.year ?? "Not set"}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-muted-foreground">Home base</p>
                {isEditing ? (
                  <Input
                    value={profile.homeBase ?? ""}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        homeBase: e.target.value,
                      }))
                    }
                    placeholder="e.g. Isla Vista, CA"
                    className="mt-1 h-9"
                  />
                ) : (
                  <p className="font-medium text-foreground">
                    {profile.homeBase ?? "Not set"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-muted-foreground">Bio</p>
                {isEditing ? (
                  <Textarea
                    value={profile.bio ?? ""}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    placeholder="Tell other Gauchos a bit about yourself."
                    className="mt-1 min-h-[80px]"
                  />
                ) : profile.bio ? (
                  <p className="text-foreground">{profile.bio}</p>
                ) : (
                  <p className="text-muted-foreground">No bio yet.</p>
                )}
              </div>

              <div>
                <p className="text-muted-foreground">Preferred event types</p>
                {isEditing ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {EVENT_CATEGORIES.map((type) => (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-2 text-xs text-foreground"
                      >
                        <Checkbox
                          checked={profile.preferredEventTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            setProfile((prev) => {
                              const selected = prev.preferredEventTypes;
                              if (checked) {
                                if (selected.includes(type)) return prev;
                                return {
                                  ...prev,
                                  preferredEventTypes: [...selected, type],
                                };
                              }
                              return {
                                ...prev,
                                preferredEventTypes: selected.filter(
                                  (t) => t !== type
                                ),
                              };
                            });
                          }}
                          aria-label={type}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {profile.preferredEventTypes.map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    Event announcements
                  </p>
                  <p className="text-xs">
                    New campus and IV events that match your interests.
                  </p>
                </div>
                {isEditing ? (
                  <Checkbox
                    checked={profile.notificationPreferences.emailEvents}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        notificationPreferences: {
                          ...prev.notificationPreferences,
                          emailEvents: !!checked,
                        },
                      }))
                    }
                    aria-label="Toggle event announcement emails"
                  />
                ) : (
                  <span className="text-xs text-primary">
                    {profile.notificationPreferences.emailEvents
                      ? "On (email)"
                      : "Off"}
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    RSVP reminders
                  </p>
                  <p className="text-xs">
                    Day-of reminders for events you&apos;ve RSVP&apos;d to.
                  </p>
                </div>
                {isEditing ? (
                  <Checkbox
                    checked={profile.notificationPreferences.emailReminders}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        notificationPreferences: {
                          ...prev.notificationPreferences,
                          emailReminders: !!checked,
                        },
                      }))
                    }
                    aria-label="Toggle RSVP reminder emails"
                  />
                ) : (
                  <span className="text-xs text-primary">
                    {profile.notificationPreferences.emailReminders
                      ? "On (email)"
                      : "Off"}
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    Friend activity
                  </p>
                  <p className="text-xs">
                    When friends join events you&apos;re interested in.
                  </p>
                </div>
                {isEditing ? (
                  <Checkbox
                    checked={
                      profile.notificationPreferences.emailFriendActivity
                    }
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        notificationPreferences: {
                          ...prev.notificationPreferences,
                          emailFriendActivity: !!checked,
                        },
                      }))
                    }
                    aria-label="Toggle friend activity emails"
                  />
                ) : (
                  <span className="text-xs text-primary">
                    {profile.notificationPreferences.emailFriendActivity
                      ? "On (email)"
                      : "Off"}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

