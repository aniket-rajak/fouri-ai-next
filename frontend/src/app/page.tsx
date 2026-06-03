import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import { AdSlot } from "@/components/AdSlot";
const FeaturesSection = dynamic(
  () => import("@/components/landing/FeaturesSection"),
  { ssr: true },
);
const StudentBenefits = dynamic(
  () => import("@/components/landing/StudentBenefits"),
  { ssr: true },
);
const AIDashboardShowcase = dynamic(
  () => import("@/components/landing/AIDashboardShowcase"),
  { ssr: true },
);
const AboutSection = dynamic(
  () => import("@/components/landing/AboutSection"),
  { ssr: true },
);
const Testimonials = dynamic(
  () => import("@/components/landing/Testimonials"),
  { ssr: true },
);
const FreeAccess = dynamic(() => import("@/components/landing/FreeAccess"), {
  ssr: true,
});
const FinalCTA = dynamic(() => import("@/components/landing/FinalCTA"), {
  ssr: true,
});
const FAQSection = dynamic(() => import("@/components/landing/FAQSection"), {
  ssr: true,
});
const BlogSection = dynamic(() => import("@/components/blog/BlogSection"), {
  ssr: true,
});
const Footer = dynamic(() => import("@/components/landing/Footer"), {
  ssr: true,
});

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <AdSlot
        slot="landing-in-content"
        format="horizontal"
        className="mx-auto max-w-[728px] my-8 px-4 sm:px-6 lg:px-8"
      />
      <FeaturesSection />
      <StudentBenefits />
      <AIDashboardShowcase />
      <AboutSection />
      <Testimonials />
      <FreeAccess />
      <FinalCTA />
      <FAQSection />
      <BlogSection />
      <Footer />
    </main>
  );
}
