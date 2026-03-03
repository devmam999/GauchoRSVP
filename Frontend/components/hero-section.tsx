"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="pointer-events-none absolute left-1/2 top-8 h-60 w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="flex flex-col items-center rounded-3xl border border-border/60 bg-card/55 px-8 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:px-12">
        <h1
          className="animate-fade-in text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ animationDelay: "0.1s" }}
        >
          Welcome to Gaucho
          <br />
          <span className="text-primary">RSVP!</span>
        </h1>

        <p
          className="animate-fade-in mt-5 max-w-lg text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "0.3s" }}
        >
          Discover events on campus, RSVP with friends, and never miss out on
          what matters.
        </p>

        <div
          className="animate-fade-in mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
          style={{ animationDelay: "0.5s" }}
        >
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary/40 bg-[linear-gradient(120deg,rgba(59,130,246,1),rgba(14,165,233,0.95),rgba(168,85,247,0.9))] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-[linear-gradient(105deg,transparent_36%,rgba(255,255,255,0.35)_50%,transparent_64%)] transition-transform duration-700 group-hover:translate-x-[130%]" />
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/about"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-border/70 bg-[linear-gradient(120deg,rgba(30,41,59,0.95),rgba(51,65,85,0.95),rgba(71,85,105,0.9))] px-8 py-3.5 text-base font-semibold text-slate-100 shadow-lg shadow-secondary/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-[linear-gradient(105deg,transparent_36%,rgba(255,255,255,0.18)_50%,transparent_64%)] transition-transform duration-700 group-hover:translate-x-[130%]" />
            About Us
          </Link>
        </div>

        <p
          className="animate-fade-in mt-8 text-base text-muted-foreground"
          style={{ animationDelay: "0.7s" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-3 py-1 font-medium text-primary transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-primary/20"
          >
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
