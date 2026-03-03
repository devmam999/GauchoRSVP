import { SignupForm } from "@/components/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[url('/ucsb-night.png')] bg-cover bg-center bg-no-repeat" />
      <div className="pointer-events-none absolute inset-0 bg-black/62" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.20),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_40%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.14),transparent_35%)]" />
      <div className="animate-fade-in relative z-10 flex w-full max-w-md flex-col items-center gap-8 rounded-3xl border border-border/60 bg-card/55 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <Link
          href="/"
          className="mb-2 flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
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
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {"Let\u2019s get started!"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your Gaucho RSVP account
          </p>
        </div>

        <SignupForm />
      </div>
    </main>
  );
}
