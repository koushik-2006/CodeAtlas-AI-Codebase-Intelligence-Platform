"use client";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { LanguageTicker } from "@/components/landing/LanguageTicker";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DemoTeaserSection } from "@/components/landing/DemoTeaserSection";
import { WorkflowExamplesSection } from "@/components/landing/WorkflowExamplesSection";
import { SecurityPrivacySection } from "@/components/landing/SecurityPrivacySection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
      <LandingHeader />
      <HeroSection />
      <LanguageTicker />
      <ProblemSection />
      <FeatureGrid />
      <HowItWorks />
      <DemoTeaserSection />
      <WorkflowExamplesSection />
      <SecurityPrivacySection />
      <FAQSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
