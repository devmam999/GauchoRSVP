"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex flex-col items-center">
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
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-3.5 text-base font-semibold text-secondary-foreground shadow-lg shadow-secondary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
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
            className="font-medium text-foreground underline underline-offset-4 transition-colors duration-200 hover:text-primary"
          >
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
