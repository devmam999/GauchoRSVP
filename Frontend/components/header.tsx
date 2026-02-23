import Link from "next/link";

export function Header() {
  return (
    <header className="flex w-full items-center px-6 py-4 sm:px-8">
      <Link href="/" className="flex items-center gap-2" aria-label="Gaucho RSVP Home">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
          <span className="text-lg font-bold text-primary">G</span>
        </div>
        <span className="text-lg font-semibold text-foreground">
          Gaucho RSVP
        </span>
      </Link>
    </header>
  );
}
