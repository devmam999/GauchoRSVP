import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_40%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_35%)]" />
      <div className="relative z-10 w-full max-w-md animate-fade-in rounded-3xl border border-border/60 bg-card/55 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome back
        </h1>
        <p className="mb-8 text-muted-foreground">
          Log in to your Gaucho RSVP account
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
