import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[url('/ucsb-night.png')] bg-cover bg-center bg-no-repeat" />
      <div className="pointer-events-none absolute inset-0 bg-black/62" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.20),transparent_42%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_40%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.14),transparent_35%)]" />
      <Header />
      <HeroSection />
    </main>
  );
}
