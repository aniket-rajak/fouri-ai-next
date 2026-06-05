"use client";

import dynamic from "next/dynamic";

const FeaturesSection = dynamic(
  () => import("@/components/landing/FeaturesSection"),
  { ssr: false },
);
const StudentBenefits = dynamic(
  () => import("@/components/landing/StudentBenefits"),
  { ssr: false },
);
const AIDashboardShowcase = dynamic(
  () => import("@/components/landing/AIDashboardShowcase"),
  { ssr: false },
);
const AboutSection = dynamic(
  () => import("@/components/landing/AboutSection"),
  { ssr: false },
);
const Testimonials = dynamic(
  () => import("@/components/landing/Testimonials"),
  { ssr: false },
);
const FreeAccess = dynamic(() => import("@/components/landing/FreeAccess"), {
  ssr: false,
});
const FinalCTA = dynamic(() => import("@/components/landing/FinalCTA"), {
  ssr: false,
});
const FAQSection = dynamic(() => import("@/components/landing/FAQSection"), {
  ssr: false,
});
const BlogSection = dynamic(() => import("@/components/blog/BlogSection"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/landing/Footer"), {
  ssr: false,
});

export default function HomeClient() {
  return (
    <>
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
    </>
  );
}
