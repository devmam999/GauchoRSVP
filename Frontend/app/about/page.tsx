import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AboutCards } from "@/components/about-cards";

export default function AboutPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 py-8 sm:px-8 sm:py-12">
      <Link
        href="/"
        className="animate-fade-in group mb-12 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:scale-105 hover:brightness-110 sm:text-base"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to Homepage
      </Link>

      <div className="mx-auto w-full max-w-4xl flex-1">
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
