"use client";

import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorNoticeProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorNotice({
  message,
  title = "Something went wrong",
  onDismiss,
  className,
}: ErrorNoticeProps) {
  return (
    <Alert
      variant="destructive"
      className={`border-destructive/40 bg-destructive/10 backdrop-blur-sm ${className ?? ""}`}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between gap-2">
        <span>{title}</span>
        {onDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Dismiss error"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
