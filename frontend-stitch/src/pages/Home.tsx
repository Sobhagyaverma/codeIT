import AppFooter from "../components/AppFooter";
import AppNav from "../components/AppNav";
import {
  AboutStatsSection,
  AiCoachSection,
  CodeRoomsSection,
  ComparisonSection,
  EcosystemSection,
  EverythingIncludedSection,
  FinalCtaSection,
  HeroSection,
  HowItWorksSection,
  LiveStatsBanner,
  QuickClashSection,
} from "../components/home";
import { useHomeStats } from "../hooks/useHomeStats";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";

/** Landing page — Stitch export integrated with AppNav + AppFooter. */
export default function Home() {
  const stats = useHomeStats();
  useRevealOnScroll();

  return (
    <div className="landing-page font-body-md relative flex min-h-screen flex-col text-on-surface antialiased selection:bg-primary-container/30">
      <AppNav />
      <main className="relative flex-grow pt-32 pb-24">
        <HeroSection />
        <LiveStatsBanner stats={stats} />
        <AboutStatsSection stats={stats} />
        <EcosystemSection />
        <AiCoachSection />
        <QuickClashSection />
        <CodeRoomsSection />
        <ComparisonSection />
        <EverythingIncludedSection />
        <HowItWorksSection />
        <FinalCtaSection />
      </main>
      <AppFooter />
    </div>
  );
}
