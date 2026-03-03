import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AboutCards } from "@/components/about-cards";

export default function AboutPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background px-6 py-8 sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[url('/ucsb-night.png')] bg-cover bg-center bg-no-repeat" />
      <div className="pointer-events-none absolute inset-0 bg-black/62" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.20),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_40%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.14),transparent_35%)]" />
      <Link
        href="/"
        className="animate-fade-in group relative z-10 mb-12 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:scale-105 hover:brightness-110 sm:text-base"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to Homepage
      </Link>

      <div className="relative z-10 mx-auto w-full max-w-4xl flex-1 rounded-3xl border border-border/60 bg-card/55 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <h1
          className="animate-fade-in mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          style={{ animationDelay: "0.1s" }}
        >
          What is <span className="text-primary">Gaucho RSVP</span>?
        </h1>
        <p
          className="animate-fade-in mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "0.2s" }}
        >
          Everything you need to make the most of campus life, all in one place.
        </p>

        <AboutCards />
      </div>
    </main>
  );
}
