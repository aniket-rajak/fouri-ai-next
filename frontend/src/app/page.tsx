import dynamic from "next/dynamic";
import { AdSlot } from "@/components/AdSlot";
import HomeClient from "@/components/landing/HomeClient";

const sectionLoading = <div className="w-full animate-pulse bg-[#0C0C0C] min-h-[300px]" />;

const Navbar = dynamic(() => import("@/components/landing/Navbar"), {
  loading: () => <div className="h-16 bg-[#08080f]" />,
});
const HeroSection = dynamic(
  () => import("@/components/landing/HeroSection"),
  { loading: () => <div className="min-h-screen bg-[#0C0C0C]" /> }
);
const HowItWorks = dynamic(
  () => import("@/components/landing/HowItWorks"),
  { loading: () => sectionLoading }
);
const FreeAIQuizSection = dynamic(
  () => import("@/components/landing/FreeAIQuizSection"),
  { loading: () => sectionLoading }
);

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FreeAIQuizSection />
      <AdSlot
        slot="landing-in-content"
        format="horizontal"
        className="mx-auto max-w-[728px] my-8 px-4 sm:px-6 lg:px-8"
      />
      <HomeClient />
    </main>
  );
}
