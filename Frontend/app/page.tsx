import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <Header />
      <HeroSection />
    </main>
  );
}
