"use client";

import { useState } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Sparkles, BrainCircuit, BarChart3, Timer, CheckCircle2, Lightbulb, Star, BookOpen,
} from "lucide-react";
import Link from "next/link";
import QuizModal from "@/components/exam/QuizModal";

const steps = [
  {
    icon: BookOpen,
    title: "Enter Your Details",
    desc: "Choose any subject, pick a specific topic, and select your preferred difficulty level — Easy, Medium, or Hard.",
    gradient: "from-[#3D81E3] to-[#00D2FF]",
  },
  {
    icon: BrainCircuit,
    title: "AI Generates Your Quiz",
    desc: "The AI instantly creates 10 multiple-choice questions with a 10-minute timer, tailored to your exact inputs.",
    gradient: "from-[#00D2FF] to-[#A4F4FD]",
  },
  {
    icon: BarChart3,
    title: "Review & Improve",
    desc: "Get a detailed performance report with your score, accuracy percentage, answer analysis, and personalized study feedback.",
    gradient: "from-[#A4F4FD] to-[#3D81E3]",
  },
];

const features = [
  { icon: CheckCircle2, label: "10 MCQ Questions" },
  { icon: Timer, label: "10-Minute Timer" },
  { icon: BarChart3, label: "Score & Accuracy" },
  { icon: Lightbulb, label: "AI Explanations" },
  { icon: Star, label: "Weak Area Insights" },
  { icon: Sparkles, label: "Ratings & Feedback" },
];

export default function FreeAIQuizSection() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <LazyMotion features={domAnimation}>
      <section
        id="ai-quiz-generator"
        className="py-16 md:py-24 lg:py-28 relative overflow-hidden"
        aria-label="Free AI-powered quiz generator"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C] via-[#0d0d15] to-[#0C0C0C] pointer-events-none" />

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "FOURI AI Quiz Generator",
              applicationCategory: "EducationalApplication",
              description:
                "Generate AI-powered practice quizzes on any subject and topic with multiple difficulty levels.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "INR",
                availability: "https://schema.org/InStock",
              },
              featureList: [
                "AI-generated multiple-choice questions",
                "10-minute timed quizzes",
                "Detailed performance reports",
                "Personalized study feedback",
              ],
            }),
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
              Free AI Quiz Generator
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
              Generate AI-Powered{" "}
              <span className="text-gradient">Quizzes in Seconds</span>
            </h2>
            <p className="mt-3 text-[#888899] text-sm sm:text-base max-w-2xl mx-auto">
              Choose any subject, pick a topic, set the difficulty level — FOURI AI instantly creates a
              personalized 10-question quiz tailored to your needs.
            </p>
          </m.div>

          {/* Quick-start CTA */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="max-w-lg mx-auto mb-14 md:mb-20 text-center"
          >
            <p className="text-sm text-[#888899] mb-5">
              Enter a subject, topic, and difficulty — then let AI handle the rest.
            </p>
            <button
              onClick={() => setQuizOpen(true)}
              className="relative group inline-flex items-center gap-2 h-12 px-8 rounded-xl text-sm font-semibold text-white overflow-hidden cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Try Quiz Generator
              </span>
            </button>
          </m.div>

          {/* How It Works — 3 steps */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-[#888899]">
              How It Works
            </span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-bold font-heading text-[#f5f5f7]">
              3 Simple Steps
            </h3>
          </m.div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mb-14 md:mb-20">
            {steps.map((step, i) => (
              <m.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500 text-center"
              >
                <span className="text-[10px] font-bold tracking-widest text-[#00D2FF]">
                  STEP 0{i + 1}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg mt-3 mb-3 mx-auto`}>
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-[#f5f5f7]">{step.title}</h4>
                <p className="mt-1.5 text-xs text-[#888899] leading-relaxed">{step.desc}</p>
              </m.div>
            ))}
          </div>

          {/* Feature chips */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-2 mb-10 md:mb-14"
          >
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#c0c0c0] bg-white/[0.03] border border-white/[0.06]"
              >
                <f.icon className="w-3 h-3 text-[#00D2FF]" />
                {f.label}
              </span>
            ))}
          </m.div>

          {/* Guest info */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto mb-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center"
          >
            <p className="text-sm text-amber-200/90">
              <span className="font-semibold">Guest users:</span> 1 free AI quiz per day.
              <br className="sm:hidden" />{" "}
              <Link href="/register" className="underline font-medium hover:text-amber-100 transition-colors">
                Create an account
              </Link>{" "}
              or{" "}
              <Link href="/login" className="underline font-medium hover:text-amber-100 transition-colors">
                log in
              </Link>{" "}
              for unlimited quiz generation.
            </p>
          </m.div>

          {/* CTA */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button
              onClick={() => setQuizOpen(true)}
              className="relative group inline-flex items-center gap-2 h-12 px-8 rounded-xl text-sm font-semibold text-white overflow-hidden cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Your Free Quiz
              </span>
            </button>
          </m.div>
        </div>
      </section>

      <QuizModal isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </LazyMotion>
  );
}
