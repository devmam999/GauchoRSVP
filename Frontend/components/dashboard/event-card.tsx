"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CampusEvent } from "@/lib/dashboard/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/utils";
import { Bike, Camera, Check, ChevronDown, Footprints, MapPin, Star } from "lucide-react";

function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function summarizeList(values?: string[]) {
  if (!values || values.length === 0) return "None";
  const preview = values.slice(0, 2).join(", ");
  return values.length > 2 ? `${preview} +${values.length - 2}` : preview;
}

function prettyLabel(values?: string[]) {
  if (!values || values.length === 0) return "None";
  const preview = values.slice(0, 2).join(", ");
  return values.length > 2 ? `${preview} +${values.length - 2}` : preview;
}

export interface EventCardProps {
  event: CampusEvent;
  /** When true, show a checkmark to indicate current user has RSVP'd */
  isRsvped?: boolean;
  className?: string;
}

export function EventCard({ event, isRsvped, className }: EventCardProps) {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summary, setSummary] = useState({
    averageRating: 0,
    reviewCount: 0,
    rsvpCount: 0,
    userHasRsvped: !!isRsvped,
  });
  const [reviews, setReviews] = useState<
    Array<{
      id: string;
      username: string;
      rating: number;
      reviewText: string;
      imageUrl: string | null;
      updatedAt: number;
    }>
  >([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendListOpen, setFriendListOpen] = useState(false);
  const [openMeta, setOpenMeta] = useState<null | "audience" | "topic" | "types">(null);

  const link = event.rsvpLink ?? event.sourceLink;
  const linkLabel = "info/RSVP";
  const displayedAttendance =
    (event.localistNumAttending ?? 0) + summary.rsvpCount;

  function starColorClass(value: number) {
    if (value <= 1.9) return "text-red-400";
    if (value <= 3.9) return "text-yellow-400";
    return "text-green-400";
  }

  async function loadSummary() {
    if (!apiBaseUrl) return;
    const params = new URLSearchParams({ eventId: event.id });
    if (currentUser?.id) {
      params.set("userId", currentUser.id);
    }
    const res = await fetch(`${apiBaseUrl}/event/engagement?${params.toString()}`);
    const payload = (await res.json()) as {
      averageRating?: number;
      reviewCount?: number;
      rsvpCount?: number;
      userHasRsvped?: boolean;
    };
    if (!res.ok) return;
    setSummary({
      averageRating: payload.averageRating ?? 0,
      reviewCount: payload.reviewCount ?? 0,
      rsvpCount: payload.rsvpCount ?? 0,
      userHasRsvped: payload.userHasRsvped ?? false,
    });
  }

  async function loadReviews() {
    if (!apiBaseUrl) return;
    const res = await fetch(
      `${apiBaseUrl}/event/reviews?eventId=${encodeURIComponent(event.id)}`
    );
    const payload = (await res.json()) as {
      reviews?: Array<{
        id: string;
        username: string;
        rating: number;
        reviewText: string;
        imageUrl: string | null;
        updatedAt: number;
      }>;
      averageRating?: number;
      reviewCount?: number;
    };
    if (!res.ok) return;
    setReviews(payload.reviews ?? []);
    setSummary((prev) => ({
      ...prev,
      averageRating: payload.averageRating ?? prev.averageRating,
      reviewCount: payload.reviewCount ?? prev.reviewCount,
    }));
  }

  useEffect(() => {
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, apiBaseUrl]);

  useEffect(() => {
    if (!dialogOpen) return;
    void loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen]);

  async function handleToggleRsvp() {
    if (!apiBaseUrl || !currentUser?.id) {
      setError("Please log in to RSVP.");
      return;
    }

    const res = await fetch(`${apiBaseUrl}/event/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        userId: currentUser.id,
      }),
    });
    const payload = (await res.json()) as {
      error?: string;
      userHasRsvped?: boolean;
      count?: number;
    };
    if (!res.ok) {
      setError(payload.error ?? "Could not update RSVP.");
      return;
    }
    setSummary((prev) => ({
      ...prev,
      userHasRsvped: payload.userHasRsvped ?? prev.userHasRsvped,
      rsvpCount: payload.count ?? prev.rsvpCount,
    }));
  }

  async function handleSubmitReview() {
    if (!apiBaseUrl || !currentUser?.id) {
      setError("Please log in to leave a review.");
      return;
    }
    if (!reviewText.trim()) {
      setError("Please write a review before submitting.");
      return;
    }

    setIsSubmittingReview(true);
    setError(null);
    try {
      let imageStorageId: string | undefined;
      let imageUrl: string | undefined;
      if (reviewImage) {
        const form = new FormData();
        form.append("image", reviewImage);
        const uploadRes = await fetch(`${apiBaseUrl}/event/review-image`, {
          method: "POST",
          body: form,
        });
        const uploadPayload = (await uploadRes.json()) as {
          error?: string;
          imageStorageId?: string;
          imageUrl?: string | null;
        };
        if (!uploadRes.ok) {
          throw new Error(uploadPayload.error ?? "Could not upload review image.");
        }
        imageStorageId = uploadPayload.imageStorageId;
        imageUrl = uploadPayload.imageUrl ?? undefined;
      }

      const res = await fetch(`${apiBaseUrl}/event/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          userId: currentUser.id,
          rating: reviewRating,
          reviewText: reviewText.trim(),
          imageStorageId,
          imageUrl,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        averageRating?: number;
        reviewCount?: number;
        reviews?: Array<{
          id: string;
          username: string;
          rating: number;
          reviewText: string;
          imageUrl: string | null;
          updatedAt: number;
        }>;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not submit review.");
      }

      setReviews(payload.reviews ?? []);
      setSummary((prev) => ({
        ...prev,
        averageRating: payload.averageRating ?? prev.averageRating,
        reviewCount: payload.reviewCount ?? prev.reviewCount,
      }));
      setReviewText("");
      setReviewImage(null);
      setReviewRating(5);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Could not submit review.";
      setError(message);
    } finally {
      setIsSubmittingReview(false);
    }
  }

  function toggleMeta(key: "audience" | "topic" | "types") {
    setOpenMeta((prev) => (prev === key ? null : key));
  }

  return (
    <>
      <Card
        className={cn(
          "border-border bg-card text-card-foreground rounded-xl border py-4 shadow-sm",
          className
        )}
      >
        <CardHeader className="pb-1 px-4">
          <CardTitle className="flex items-start justify-between gap-2 text-sm font-semibold leading-tight">
            <span className="text-foreground">{event.name}</span>
            {(isRsvped || summary.userHasRsvped) && (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary"
                title="You're going"
              >
                <Check className="h-3 w-3" />
                Going
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-4 text-sm text-muted-foreground">
          <p>{formatEventDateTime(event.startTime)}</p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {event.location}
          </p>
          <div className="space-y-1 text-xs">
            <button
              type="button"
              onClick={() => toggleMeta("audience")}
              className="flex w-full items-center justify-between rounded-md border border-border/70 bg-background/40 px-2 py-1 text-left transition-colors hover:bg-muted/60"
            >
              <span>
                <span className="text-foreground/90">Event target audience:</span>{" "}
                {prettyLabel(event.targetAudience)}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  openMeta === "audience" && "rotate-180"
                )}
              />
            </button>
            {openMeta === "audience" ? (
              <div className="rounded-md border border-border/70 bg-background/30 p-2 text-[11px] text-muted-foreground">
                {(event.targetAudience ?? []).length > 0
                  ? (event.targetAudience ?? []).join(", ")
                  : "None"}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => toggleMeta("topic")}
              className="flex w-full items-center justify-between rounded-md border border-border/70 bg-background/40 px-2 py-1 text-left transition-colors hover:bg-muted/60"
            >
              <span>
                <span className="text-foreground/90">Event topic:</span>{" "}
                {prettyLabel(event.topics)}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  openMeta === "topic" && "rotate-180"
                )}
              />
            </button>
            {openMeta === "topic" ? (
              <div className="rounded-md border border-border/70 bg-background/30 p-2 text-[11px] text-muted-foreground">
                {(event.topics ?? []).length > 0 ? (event.topics ?? []).join(", ") : "None"}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => toggleMeta("types")}
              className="flex w-full items-center justify-between rounded-md border border-border/70 bg-background/40 px-2 py-1 text-left transition-colors hover:bg-muted/60"
            >
              <span>
                <span className="text-foreground/90">Event types:</span>{" "}
                {prettyLabel(event.types)}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  openMeta === "types" && "rotate-180"
                )}
              />
            </button>
            {openMeta === "types" ? (
              <div className="rounded-md border border-border/70 bg-background/30 p-2 text-[11px] text-muted-foreground">
                {(event.types ?? []).length > 0 ? (event.types ?? []).join(", ") : "None"}
              </div>
            ) : null}
          </div>
          <p className="text-xs">
            Attendance: <span className="font-medium text-foreground">{displayedAttendance}</span>
          </p>
          {(event.friendRsvpCount ?? 0) > 0 ? (
            <div className="space-y-1 text-[11px]">
              <button
                type="button"
                onClick={() => setFriendListOpen((prev) => !prev)}
                className="rounded-full border border-blue-400/50 bg-blue-500/20 px-2 py-0.5 text-blue-100 transition-colors hover:bg-blue-500/30"
              >
                {event.friendRsvpCount} friend
                {(event.friendRsvpCount ?? 0) === 1 ? "" : "s"} going
              </button>
              {friendListOpen ? (
                <div className="rounded-md border border-border/70 bg-background/40 p-2 text-muted-foreground">
                  {(event.friendRsvpUsernames ?? []).map((username) => (
                    <div key={username}>@{username}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {event.distanceMiles != null &&
          event.walkMinutes != null &&
          event.bikeMinutes != null ? (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded-full border border-border/70 bg-background/40 px-2 py-0.5 text-muted-foreground">
                {event.distanceMiles.toFixed(1)} mi away
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/40 px-2 py-0.5 text-muted-foreground">
                <Footprints className="h-3 w-3" />
                {event.walkMinutes} min walk
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/40 px-2 py-0.5 text-muted-foreground">
                <Bike className="h-3 w-3" />
                {event.bikeMinutes} min bike
              </span>
            </div>
          ) : null}
          <p className="text-xs">
            <span className={cn("font-semibold", starColorClass(summary.averageRating))}>
              {summary.averageRating.toFixed(1)} stars
            </span>{" "}
            ({summary.reviewCount} reviews)
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="h-9 rounded-full px-4 text-sm font-semibold"
              onClick={handleToggleRsvp}
            >
              {summary.userHasRsvped ? <Check className="mr-1 h-3.5 w-3.5" /> : null}
              I RSVPed
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 rounded-full px-4 text-sm">
                  View details & reviews
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{event.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 overflow-y-auto pr-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-border/70 px-2 py-1">
                      Attendance: {displayedAttendance}
                    </span>
                    <span className={cn("rounded-full border px-2 py-1", starColorClass(summary.averageRating))}>
                      {summary.averageRating.toFixed(1)} stars
                    </span>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-card/70 p-3">
                    <h4 className="mb-2 text-sm font-semibold">Leave a review</h4>
                    <div className="mb-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewRating(value)}
                          className={cn(
                            "transition-transform hover:scale-110",
                            value <= reviewRating ? starColorClass(value) : "text-muted-foreground"
                          )}
                          aria-label={`Rate ${value} stars`}
                        >
                          <Star className="h-5 w-5 fill-current" />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={reviewText}
                      onChange={(eventInput) => setReviewText(eventInput.target.value)}
                      placeholder="Write your review..."
                      className="mb-2 min-h-[80px]"
                    />
                    <label className="mb-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs">
                      <Camera className="h-3.5 w-3.5" />
                      Add image
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(eventInput) =>
                          setReviewImage(eventInput.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                    {reviewImage ? (
                      <p className="mb-2 text-xs text-muted-foreground">
                        Selected image: {reviewImage.name}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                      >
                        {isSubmittingReview ? "Submitting..." : "Submit review"}
                      </Button>
                    </div>
                    {error ? (
                      <p className="mt-2 text-xs text-destructive">{error}</p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-border/70 bg-card/70 p-3">
                    <h4 className="mb-2 text-sm font-semibold">
                      Reviews ({summary.reviewCount})
                    </h4>
                    {reviews.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No reviews yet.</p>
                    ) : (
                      <div
                        className={cn(
                          "space-y-2",
                          reviews.length > 5 && "max-h-[22rem] overflow-y-auto pr-1"
                        )}
                      >
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="rounded-md border border-border/60 bg-background/40 p-2"
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {review.username}
                              </span>
                              <span className={cn("text-xs font-semibold", starColorClass(review.rating))}>
                                {review.rating.toFixed(1)} stars
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{review.reviewText}</p>
                            {review.imageUrl ? (
                              <img
                                src={review.imageUrl}
                                alt="Review attachment"
                                className="mt-2 max-h-52 w-full rounded-md object-cover"
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-base font-semibold text-primary underline underline-offset-2 hover:no-underline"
              >
                {linkLabel} →
              </a>
            )}
          </div>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
