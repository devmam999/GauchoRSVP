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
import { Switch } from "@/components/ui/switch";
import { ErrorNotice } from "@/components/ui/error-notice";
import { clearCurrentUser, getCurrentUser } from "@/lib/auth/current-user";
import {
  loadStoredProfileImage,
  saveStoredProfileImage,
} from "@/lib/auth/profile-image";
import { loadAdditionalInfo } from "@/lib/auth/additional-info";
import { type UserProfile } from "@/lib/dashboard/types";
import {
  EVENT_TOPIC_OPTIONS,
  loadTopicRanking,
  saveTopicRanking,
  type EventTopicOption,
} from "@/lib/user-preferences";
import { Pencil } from "lucide-react";

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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Could not read selected image."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.readAsDataURL(file);
  });
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={
        enabled
          ? "rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400"
          : "rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400"
      }
    >
      {enabled ? "On" : "Off"}
    </span>
  );
}

export default function ProfileClient() {
  const router = useRouter();
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [topicRanking, setTopicRanking] = useState<EventTopicOption[]>([
    ...EVENT_TOPIC_OPTIONS,
  ]);
  const updateProfile = (updater: (prev: UserProfile) => UserProfile) => {
    setProfile((prev) => (prev ? updater(prev) : prev));
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setLoadError("No active user session found. Please log in again.");
      return;
    }
    const activeUser = currentUser;
    if (!apiBaseUrl) {
      setLoadError("Missing NEXT_PUBLIC_CONVEX_HTTP_URL in frontend environment.");
      return;
    }

    let isMounted = true;
    async function loadProfile() {
      try {
        const res = await fetch(
          `${apiBaseUrl}/user?userId=${encodeURIComponent(activeUser.id)}`
        );
        const payload = (await res.json()) as {
          user?: { id: string; username: string; email: string };
          error?: string;
        };
        if (!res.ok || !payload.user) {
          throw new Error(payload.error ?? "Could not load user profile.");
        }
        if (!isMounted) return;
        const persistedImage = loadStoredProfileImage(payload.user.id);
        const additionalInfo = loadAdditionalInfo(payload.user.id);
        const storedTopicRanking = loadTopicRanking();
        setProfile(
          {
            ...buildDefaultProfile({
              id: payload.user.id,
              username: payload.user.username,
              email: payload.user.email,
            }),
            major: additionalInfo?.major ?? "",
            year: additionalInfo?.year ?? "",
          }
        );
        if (storedTopicRanking && storedTopicRanking.length > 0) {
          setTopicRanking(storedTopicRanking);
        }
        if (persistedImage) {
          setProfile((prev) => (prev ? { ...prev, profileImageUrl: persistedImage } : prev));
        }
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

  const handleProfileImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarError("Please upload a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be 5MB or smaller.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProfile((prev) => (prev ? { ...prev, profileImageUrl: dataUrl } : prev));
      saveStoredProfileImage(profile.id, dataUrl);
      setAvatarError(null);
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "Could not update profile picture."
      );
    }
  };

  const moveTopic = (index: number, direction: "up" | "down") => {
    setTopicRanking((prev) => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      saveTopicRanking(updated);
      return updated;
    });
  };

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage
                  src={profile.profileImageUrl}
                  alt={profile.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isEditing ? (
                <label
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  aria-label="Upload profile picture"
                >
                  <Pencil className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleProfileImageChange}
                  />
                </label>
              ) : null}
            </div>
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
        {avatarError ? (
          <ErrorNotice
            title="Profile picture issue"
            message={avatarError}
            onDismiss={() => setAvatarError(null)}
          />
        ) : null}

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
                        updateProfile((prev) => ({
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
                        updateProfile((prev) => ({
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
                <p className="text-muted-foreground">Bio</p>
                {isEditing ? (
                  <Textarea
                    value={profile.bio ?? ""}
                    onChange={(e) =>
                      updateProfile((prev) => ({
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
                  <div className="mt-2 space-y-2">
                    {topicRanking.map((topic, index) => (
                      <div
                        key={topic}
                        className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-primary">
                            #{index + 1}
                          </span>
                          <span className="text-sm text-foreground">{topic}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-md px-2 text-xs"
                            onClick={() => moveTopic(index, "up")}
                            disabled={index === 0}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-md px-2 text-xs"
                            onClick={() => moveTopic(index, "down")}
                            disabled={index === topicRanking.length - 1}
                          >
                            Down
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {topicRanking.map((type, index) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        #{index + 1} {type}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {profile.notificationPreferences.emailEvents ? "On" : "Off"}
                    </span>
                    <Switch
                      checked={profile.notificationPreferences.emailEvents}
                      onCheckedChange={(checked) =>
                        updateProfile((prev) => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            emailEvents: !!checked,
                          },
                        }))
                      }
                      aria-label="Toggle event announcement emails"
                    />
                  </div>
                ) : (
                  <StatusPill enabled={profile.notificationPreferences.emailEvents} />
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {profile.notificationPreferences.emailReminders ? "On" : "Off"}
                    </span>
                    <Switch
                      checked={profile.notificationPreferences.emailReminders}
                      onCheckedChange={(checked) =>
                        updateProfile((prev) => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            emailReminders: !!checked,
                          },
                        }))
                      }
                      aria-label="Toggle RSVP reminder emails"
                    />
                  </div>
                ) : (
                  <StatusPill enabled={profile.notificationPreferences.emailReminders} />
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {profile.notificationPreferences.emailFriendActivity ? "On" : "Off"}
                    </span>
                    <Switch
                      checked={
                        profile.notificationPreferences.emailFriendActivity
                      }
                      onCheckedChange={(checked) =>
                        updateProfile((prev) => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            emailFriendActivity: !!checked,
                          },
                        }))
                      }
                      aria-label="Toggle friend activity emails"
                    />
                  </div>
                ) : (
                  <StatusPill
                    enabled={profile.notificationPreferences.emailFriendActivity}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

