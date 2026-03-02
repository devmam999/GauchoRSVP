"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, User, Lock, Eye, EyeOff } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL?.replace(/\/$/, "") ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!apiBaseUrl) {
      setIsSubmitting(false);
      setError("Missing NEXT_PUBLIC_CONVEX_HTTP_URL in frontend environment.");
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "local",
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });
      const data = (await res.json()) as { error?: string; user?: { id?: string } };
      if (!res.ok) {
        setError(data.error ?? "Signup failed.");
        setIsSubmitting(false);
        return;
      }

      if (data.user?.id) {
        window.localStorage.setItem("gaucho.auth.userId", data.user.id);
      }
      setIsSubmitting(false);
      router.push("/dashboard");
    } catch {
      setIsSubmitting(false);
      setError("Unable to reach backend. Please try again.");
    }
  }

  async function handleGoogleSignup() {
    setError(null);
    setIsSubmitting(true);

    if (!apiBaseUrl) {
      setIsSubmitting(false);
      setError("Missing NEXT_PUBLIC_CONVEX_HTTP_URL in frontend environment.");
      return;
    }

    window.location.href = `${apiBaseUrl}/signup?provider=google`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-foreground">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@ucsb.edu"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="h-12 rounded-full border-border bg-muted/50 pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className="text-foreground">
          Username
        </Label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="username"
            type="text"
            placeholder="gaucho123"
            required
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="h-12 rounded-full border-border bg-muted/50 pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-foreground">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="h-12 rounded-full border-border bg-muted/50 pl-10 pr-12 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-3">
        <div className="relative flex items-center justify-center">
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          <span className="relative z-10 bg-background px-4 text-xs text-muted-foreground">
            or continue with
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 cursor-pointer gap-2 rounded-full border-border bg-foreground text-background transition-transform duration-200 hover:scale-[1.03] hover:bg-foreground/90 hover:text-background disabled:cursor-not-allowed"
            onClick={handleGoogleSignup}
            disabled={isSubmitting}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 cursor-pointer gap-2 rounded-full border-border bg-foreground text-background transition-transform duration-200 hover:scale-[1.03] hover:bg-foreground/90 hover:text-background"
            onClick={() => {
              // TODO: Implement UCSB NetID SSO
            }}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h20v14H2z" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
            UCSB Net ID
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="group mt-2 h-12 cursor-pointer rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Creating account...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Sign Up
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>

      {error ? (
        <p className="text-center text-sm text-red-500">{error}</p>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 transition-colors duration-200 hover:text-primary"
        >
          Login
        </Link>
      </p>
    </form>
  );
}
