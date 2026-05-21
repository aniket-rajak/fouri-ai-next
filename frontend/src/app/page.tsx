import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureBar from "@/components/landing/FeatureBar";
import WhatFouriDoes from "@/components/landing/WhatFouriDoes";
import AIAnalysis from "@/components/landing/AIAnalysis";
import StatsSection from "@/components/landing/StatsSection";
import CTABanner from "@/components/landing/CTABanner";
import MockTestShowcase from "@/components/landing/MockTestShowcase";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";

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
