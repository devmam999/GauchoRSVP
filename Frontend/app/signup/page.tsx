import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="animate-fade-in flex w-full max-w-md flex-col items-center gap-8">
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
