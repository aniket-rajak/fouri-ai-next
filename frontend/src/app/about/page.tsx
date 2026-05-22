import type { Metadata } from "next";
import { Sparkles, GraduationCap, Brain, BarChart3, Shield, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about FOURI.IN — the AI-powered mock test platform built for Indian students preparing for JEE, NEET, WBJEE, CUET and more.",
};

const stats = [
  { label: "AI-Powered Tests", value: "100%", icon: Brain },
  { label: "Students Helped", value: "10,000+", icon: GraduationCap },
  { label: "Questions Analyzed", value: "1M+", icon: BarChart3 },
  { label: "Exam Categories", value: "20+", icon: Globe },
];

const values = [
  {
    title: "AI-First Approach",
    desc: "Every feature is built around artificial intelligence — from OCR text extraction to intelligent question analysis and performance insights.",
    icon: Brain,
  },
  {
    title: "Student-Centric",
    desc: "We prioritise the student experience with a clean, distraction-free interface, real exam simulation, and detailed progress tracking.",
    icon: GraduationCap,
  },
  {
    title: "Privacy & Security",
    desc: "Your data is encrypted and secure. We never share your personal information or uploaded question papers with third parties.",
    icon: Shield,
  },
  {
    title: "Made in India",
    desc: "Built specifically for Indian competitive exams — JEE, NEET, WBJEE, CUET, and more — with local curriculum understanding.",
    icon: Globe,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
              About FOURI
            </h1>
          </div>
          <p className="text-[#888899] text-lg max-w-2xl mx-auto leading-relaxed">
            FOURI.IN is an AI-driven education platform that transforms how students prepare for competitive exams.
            Upload question papers, and our AI generates instant mock tests with detailed analytics.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#111118] rounded-2xl border border-white/5 p-5 text-center">
                <Icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-[#f5f5f7]">{stat.value}</div>
                <div className="text-xs text-[#888899] mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Story */}
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-8 mb-16">
          <h2 className="text-2xl font-bold text-[#f5f5f7] mb-4">Our Story</h2>
          <div className="space-y-4 text-[#c0c0cc] leading-relaxed">
            <p>
              FOURI.IN was born from a simple observation: students spend hours searching for quality mock tests,
              while teachers spend even more time creating them. We asked ourselves — what if AI could bridge this gap?
            </p>
            <p>
              Our platform uses cutting-edge OCR technology to extract questions from uploaded papers, then applies
              GPT-4o-mini to analyse and structure them into fully interactive mock tests. The result? A complete
              test-taking experience — timer, question palette, auto-save, and detailed performance analytics — generated
              in minutes instead of hours.
            </p>
            <p>
              Today, FOURI.IN serves thousands of students across India, helping them prepare for JEE Main, JEE Advanced,
              NEET UG, WBJEE, CUET, and state-level engineering and medical entrance exams.
            </p>
          </div>
        </div>

        {/* Values */}
        <h2 className="text-2xl font-bold text-[#f5f5f7] mb-6 text-center">What We Stand For</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="bg-[#111118] rounded-2xl border border-white/5 p-6">
                <Icon className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-lg font-semibold text-[#f5f5f7] mb-2">{v.title}</h3>
                <p className="text-sm text-[#888899] leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
