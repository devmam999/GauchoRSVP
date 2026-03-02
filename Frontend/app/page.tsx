import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_40%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.12),transparent_35%)]" />
      <Header />
      <HeroSection />
    </main>
  );
}
