import {
  ShieldCheck,
  UploadCloud,
  BrainCircuit,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface HowItWorksStep {
  icon: LucideIcon;
  title: string;
  desc: string;
  gradient: string;
}

export const steps: HowItWorksStep[] = [
  {
    icon: ShieldCheck,
    title: "Secure Login",
    desc: "Create your free account and get instant access to all features with no hidden charges.",
    gradient: "from-[#3D81E3] to-[#00D2FF]",
  },
  {
    icon: UploadCloud,
    title: "Upload Question Paper",
    desc: "Drag & drop any question paper — PDF, images, or handwritten scans. Our AI accepts all formats.",
    gradient: "from-[#00D2FF] to-[#A4F4FD]",
  },
  {
    icon: BrainCircuit,
    title: "AI Generates Mock Test",
    desc: "Advanced OCR + AI extracts every question, categorizes by topic, and generates a timed practice test.",
    gradient: "from-[#A4F4FD] to-[#3D81E3]",
  },
  {
    icon: BarChart3,
    title: "Performance Analysis",
    desc: "Get detailed insights, accuracy scores, subject-wise breakdowns, and AI-powered answer explanations.",
    gradient: "from-[#3D81E3] to-[#A4F4FD]",
  },
];
