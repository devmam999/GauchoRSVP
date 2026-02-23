"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, GripVertical } from "lucide-react";

interface Category {
  id: string;
  label: string;
  emoji: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "academic", label: "Academic", emoji: "\uD83D\uDCDA" },
  { id: "social", label: "Social", emoji: "\uD83C\uDF89" },
  { id: "athletic", label: "Athletic", emoji: "\uD83C\uDFC5" },
  { id: "professional", label: "Professional", emoji: "\uD83D\uDCBC" },
];

export function RankingList() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverIndex(index);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setOverIndex(null);
        return;
      }

      setCategories((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(draggedIndex, 1);
        updated.splice(dropIndex, 0, removed);
        return updated;
      });

      setDraggedIndex(null);
      setOverIndex(null);
    },
    [draggedIndex],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setOverIndex(null);
  }, []);

  // Touch-based reordering: move item up or down
  const moveItem = useCallback((index: number, direction: "up" | "down") => {
    setCategories((prev) => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  }, []);

  async function handleDone() {
    setIsSubmitting(true);

    // TODO: Replace with actual backend API call to save preferences
    // Example: await fetch('/api/user/preferences', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     rankings: categories.map((c, i) => ({ categoryId: c.id, rank: i + 1 })),
    //   }),
    // });

    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSubmitting(false);
    router.push("/");
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <ul className="flex flex-col gap-3" role="list" aria-label="Rank your choices by dragging">
        {categories.map((category, index) => (
          <li
            key={category.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`group flex cursor-grab items-center gap-4 rounded-2xl border-2 bg-muted/40 px-4 py-4 transition-all duration-200 active:cursor-grabbing sm:px-5 ${
              draggedIndex === index
                ? "scale-[1.03] border-primary opacity-80 shadow-lg shadow-primary/20"
                : overIndex === index && draggedIndex !== null
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/60"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              #{index + 1}
            </span>

            <span className="text-2xl" aria-hidden="true">
              {category.emoji}
            </span>

            <span className="flex-1 text-base font-medium text-foreground sm:text-lg">
              {category.label}
            </span>

            {/* Mobile reorder buttons */}
            <div className="flex flex-col gap-0.5 sm:hidden">
              <button
                type="button"
                onClick={() => moveItem(index, "up")}
                disabled={index === 0}
                aria-label={`Move ${category.label} up`}
                className="rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-30"
              >
                {"\u25B2"}
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, "down")}
                disabled={index === categories.length - 1}
                aria-label={`Move ${category.label} down`}
                className="rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-30"
              >
                {"\u25BC"}
              </button>
            </div>

            {/* Desktop drag handle */}
            <GripVertical className="hidden h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:block" />
          </li>
        ))}
      </ul>

      <Button
        onClick={handleDone}
        disabled={isSubmitting}
        className="group mt-2 h-12 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Done
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Drag to reorder your preferences. You can change these later.
      </p>
    </div>
  );
}
