import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureBar from "@/components/landing/FeatureBar";

const WhatFouriDoes = dynamic(() => import("@/components/landing/WhatFouriDoes"), { ssr: true });
const AIAnalysis = dynamic(() => import("@/components/landing/AIAnalysis"), { ssr: true });
const StatsSection = dynamic(() => import("@/components/landing/StatsSection"), { ssr: true });
const CTABanner = dynamic(() => import("@/components/landing/CTABanner"), { ssr: true });
const MockTestShowcase = dynamic(() => import("@/components/landing/MockTestShowcase"), { ssr: true });
const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks"), { ssr: true });
const Testimonials = dynamic(() => import("@/components/landing/Testimonials"), { ssr: true });
const FAQSection = dynamic(() => import("@/components/landing/FAQSection"), { ssr: true });
const Footer = dynamic(() => import("@/components/landing/Footer"), { ssr: true });

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeatureBar />
      <WhatFouriDoes />
      <AIAnalysis />
      <StatsSection />
      <CTABanner />
      <MockTestShowcase />
      <HowItWorks />
      <Testimonials />
      <FAQSection />
      <Footer />
    </main>
  );
}
