import { RankingList } from "@/components/ranking-list";

export default function PreferencesPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="animate-fade-in flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Rank your{" "}
            <span className="text-primary">choices!</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Help us personalize your experience
          </p>
        </div>

        <RankingList />
      </div>
    </main>
  );
}
