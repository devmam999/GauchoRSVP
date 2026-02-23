"use client";

import { useState } from "react";

interface FlipCardProps {
  icon: React.ReactNode;
  title: string;
  frontDescription: React.ReactNode;
  backDescription: React.ReactNode;
  borderColor: string;
  delay?: string;
}

export function FlipCard({
  icon,
  title,
  frontDescription,
  backDescription,
  borderColor,
  delay = "0s",
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="animate-fade-in group"
      style={{ animationDelay: delay, perspective: "1000px" }}
    >
      <button
        type="button"
        onClick={() => setIsFlipped((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsFlipped((prev) => !prev);
          }
        }}
        aria-label={`${title} - click to ${isFlipped ? "see front" : "learn more"}`}
        className="relative h-72 w-full cursor-pointer sm:h-80"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 flex flex-col items-start gap-4 rounded-2xl border-2 bg-card p-6 text-left shadow-lg transition-transform duration-500 ease-in-out sm:p-8 ${borderColor}`}
          style={{
            backfaceVisibility: "hidden",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {frontDescription}
          </p>
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 flex flex-col items-start justify-center rounded-2xl border-2 bg-card p-6 text-left shadow-lg transition-transform duration-500 ease-in-out sm:p-8 ${borderColor}`}
          style={{
            backfaceVisibility: "hidden",
            transform: isFlipped ? "rotateY(0deg)" : "rotateY(-180deg)",
          }}
        >
          <div className="text-sm leading-relaxed text-foreground sm:text-base">
            {backDescription}
          </div>
        </div>
      </button>
    </div>
  );
}
