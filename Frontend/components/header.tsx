import Link from "next/link";

export function Header() {
  return (
    <header className="relative z-10 flex w-full items-center px-6 py-4 sm:px-8">
      <Link
        href="/"
        className="group flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/40"
        aria-label="Gaucho RSVP Home"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors duration-300 group-hover:border-primary/50">
          <span className="text-lg font-bold text-primary">G</span>
        </div>
        <span className="text-lg font-semibold text-foreground">
          Gaucho RSVP
        </span>
      </Link>
    </header>
  );
}
