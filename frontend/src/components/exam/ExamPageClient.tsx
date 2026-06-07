"use client";

import { useState } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  Upload, Brain, Clock, CheckSquare, BarChart3, RefreshCw,
  Target, TrendingUp, Sparkles, ArrowRight, ChevronDown,
  CheckCircle2, XCircle, BookOpen, Users, GraduationCap,
  Lightbulb, Zap, Search, MessageSquare, Star
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ExamContactForm from "./ExamContactForm";
import QuizModal from "./QuizModal";
import QuizFeedbackCarousel from "./QuizFeedbackCarousel";
import type { ExamPage } from "@/lib/seo";

const iconMap: Record<string, React.ElementType> = {
  Upload, Brain, Clock, CheckSquare, BarChart3, RefreshCw,
  Target, TrendingUp, Sparkles, Lightbulb, Zap, Search,
};

interface Props {
  exam: ExamPage;
}

export default function ExamPageClient({ exam }: Props) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-[#08080f]">
        <Navbar />

        <main className="pt-16">
          {/* ════════════════════════════════════════ */}
          {/* HERO SECTION */}
          {/* ════════════════════════════════════════ */}
          <section className="relative min-h-[85vh] flex items-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3D81E3]/10 via-[#08080f] to-[#08080f]" />
            <div className="absolute top-20 left-10 w-[400px] h-[400px] rounded-full bg-[#3D81E3]/10 blur-[120px] animate-orb" />
            <div className="absolute bottom-20 right-10 w-[350px] h-[350px] rounded-full bg-[#00D2FF]/8 blur-[100px] animate-orb" style={{ animationDelay: "5s" }} />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzRDgxRTMiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNFYzMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 md:py-0">
              <div className="max-w-4xl">
                <m.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-3 py-1.5 rounded-full border border-[#00D2FF]/10 mb-6">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {exam.badge}
                  </span>
                </m.div>

                <m.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-heading text-[#f5f5f7] leading-[1.1] tracking-tight"
                >
                  {exam.heroTitle.split("AI")[0]}
                  <span className="text-gradient">AI</span>
                  {exam.heroTitle.includes("AI") ? exam.heroTitle.split("AI")[1] : ""}
                </m.h1>

                <m.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-6 text-base sm:text-lg text-[#888899] max-w-2xl leading-relaxed"
                >
                  {exam.heroSubtitle}
                </m.p>

                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-10 flex flex-col sm:flex-row gap-4"
                >
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl text-sm font-semibold text-white overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    <span className="relative flex items-center gap-2">
                      Start Free Practice <Sparkles className="w-4 h-4" />
                    </span>
                  </Link>
                  <Link
                    href="/discover"
                    className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl text-sm font-semibold text-[#f5f5f7] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                  >
                    <Search className="w-4 h-4" />
                    Browse Tests <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <button
                    onClick={() => setQuizOpen(true)}
                    className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl text-sm font-semibold text-[#00D2FF] bg-[#00D2FF]/5 border border-[#00D2FF]/15 hover:bg-[#00D2FF]/10 hover:border-[#00D2FF]/25 transition-all duration-300 cursor-pointer"
                  >
                    <Brain className="w-4 h-4" />
                    Try Quiz Generator
                  </button>
                </m.div>

                <m.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="mt-6 text-xs text-[#555566]"
                >
                  No credit card required. 100% free for students.
                </m.p>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* QUICK START GUIDE */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 relative overflow-hidden">
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
                  Quick Start
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
                  Get Started in <span className="text-gradient">3 Simple Steps</span>
                </h2>
              </m.div>

              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { icon: Upload, step: "01", title: "Upload Your Paper", desc: "Upload any question paper in PDF, JPG, or PNG format.", link: "/upload", linkText: "Upload now" },
                  { icon: Brain, step: "02", title: "AI Analyzes", desc: "Our AI reads every question and generates a structured mock test.", link: null, linkText: "" },
                  { icon: Clock, step: "03", title: "Start Practicing", desc: "Take the test with a live timer and review your results instantly.", link: "/register", linkText: "Create free account" },
                ].map((item, i) => (
                  <m.div
                    key={item.step}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    whileHover={{ y: -4 }}
                    className="relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500 text-center group"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] text-[10px] font-bold text-white">
                      STEP {item.step}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3D81E3] to-[#00D2FF] flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-[#f5f5f7] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#888899] leading-relaxed">{item.desc}</p>
                    {item.link && (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 mt-3 text-xs text-[#00D2FF] hover:text-[#3D81E3] transition-colors"
                      >
                        {item.linkText} <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </m.div>
                ))}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* HOW IT WORKS */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#0d0d15]/30 to-transparent">
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12 md:mb-16"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
                  How It Works
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
                  From Upload to <span className="text-gradient">Practice</span>
                </h2>
                <p className="mt-3 text-sm text-[#888899] max-w-lg mx-auto">
                  A simple process designed to help you start practicing quickly.
                </p>
              </m.div>

              <div className="relative">
                <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#3D81E3]/40 via-[#00D2FF]/20 to-transparent -translate-x-1/2" />

                {exam.howItWorks.map((step, i) => (
                  <m.div
                    key={step.title}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                    className="relative flex items-start gap-4 md:gap-8 pb-12 md:pb-16 last:pb-0"
                  >
                    <div className="hidden md:flex flex-1 justify-end">
                      {i % 2 === 0 && (
                        <div className="w-full max-w-md p-5 md:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all duration-500">
                          <span className="text-[10px] font-bold tracking-widest text-[#00D2FF]">STEP 0{i + 1}</span>
                          <h3 className="mt-2 text-lg md:text-xl font-bold text-[#f5f5f7]">{step.title}</h3>
                          <p className="mt-2 text-sm text-[#888899] leading-relaxed">{step.desc}</p>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 flex-shrink-0 md:mx-auto">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3D81E3] to-[#00D2FF] flex items-center justify-center shadow-lg shadow-[#3D81E3]/20 ring-[3px] ring-[#08080f]">
                        <span className="text-sm font-bold text-white">{i + 1}</span>
                      </div>
                    </div>

                    <div className="hidden md:flex flex-1">
                      {i % 2 !== 0 && (
                        <div className="w-full max-w-md p-5 md:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all duration-500">
                          <span className="text-[10px] font-bold tracking-widest text-[#00D2FF]">STEP 0{i + 1}</span>
                          <h3 className="mt-2 text-lg md:text-xl font-bold text-[#f5f5f7]">{step.title}</h3>
                          <p className="mt-2 text-sm text-[#888899] leading-relaxed">{step.desc}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex md:hidden flex-1 min-w-0">
                      <div className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] font-bold tracking-widest text-[#00D2FF]">STEP 0{i + 1}</span>
                        <h3 className="mt-2 text-base font-bold text-[#f5f5f7]">{step.title}</h3>
                        <p className="mt-1 text-xs text-[#888899] leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* FEATURES GRID */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 md:py-24 relative overflow-hidden">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12 md:mb-16"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
                  Features
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
                  Everything You Need <span className="text-gradient">To Prepare</span>
                </h2>
              </m.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {exam.features.map((feature, i) => {
                  const Icon = iconMap[feature.icon] || Brain;
                  const gradients = [
                    "from-[#3D81E3] to-[#00D2FF]",
                    "from-[#00D2FF] to-[#A4F4FD]",
                    "from-[#A4F4FD] to-[#3D81E3]",
                    "from-[#3D81E3] to-[#A4F4FD]",
                    "from-[#00D2FF] to-[#3D81E3]",
                    "from-[#A4F4FD] to-[#00D2FF]",
                  ];
                  return (
                    <m.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.5 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">{feature.title}</h3>
                      <p className="text-xs text-[#888899] leading-relaxed">{feature.desc}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* SUBJECTS COVERAGE */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#0d0d15]/30 to-transparent">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
                  Subjects
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
                  Available <span className="text-gradient">Topics</span>
                </h2>
                <p className="mt-3 text-sm text-[#888899] max-w-lg mx-auto">
                  Practice from a wide range of subjects and topics covered in {exam.examFullName}.
                </p>
              </m.div>

              <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
                {exam.subjects.map((subject, i) => (
                  <m.div
                    key={subject}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] shrink-0" />
                    <span className="text-sm text-[#c0c0c0]">{subject}</span>
                  </m.div>
                ))}
              </div>

              <m.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mt-8"
              >
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 text-sm text-[#00D2FF] hover:text-[#3D81E3] transition-colors"
                >
                  Browse available {exam.badge} tests <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </m.div>

              {/* Cross-links to other exam pages */}
              <m.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-10 pt-8 border-t border-white/[0.04] text-center"
              >
                <p className="text-xs text-[#555566] mb-4">Practice for other exams:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {["jee-mock-test", "neet-mock-test", "wbjee-mock-test", "cuet-mock-test"]
                    .filter((s) => s !== exam.slug)
                    .map((slug) => (
                      <Link
                        key={slug}
                        href={`/${slug}`}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-[#888899] bg-white/[0.02] border border-white/[0.04] hover:text-[#00D2FF] hover:border-[#00D2FF]/20 transition-all"
                      >
                        {slug === "jee-mock-test" ? "JEE" :
                         slug === "neet-mock-test" ? "NEET" :
                         slug === "wbjee-mock-test" ? "WBJEE" : "CUET"} Mock Tests
                      </Link>
                    ))}
                </div>
              </m.div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* WHO SHOULD USE */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 md:py-24 relative overflow-hidden">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
                  Who Is This For
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
                  Designed <span className="text-gradient">For Students</span>
                </h2>
              </m.div>

              <div className="grid sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {exam.whoShouldUse.map((item, i) => (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    whileHover={{ y: -4 }}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D81E3] to-[#00D2FF] flex items-center justify-center mb-4 shadow-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-[#c0c0c0] leading-relaxed">{item}</p>
                  </m.div>
                ))}
              </div>

              <m.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mt-8"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm text-[#00D2FF] hover:text-[#3D81E3] transition-colors"
                >
                  Create your free account <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </m.div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* HONEST COMPARISON TABLE */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#0d0d15]/30 to-transparent">
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
                  What We Offer
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
                  Features at <span className="text-gradient">a Glance</span>
                </h2>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-white/[0.04] overflow-hidden"
              >
                {exam.comparison.map((item, i) => (
                  <div
                    key={item.feature}
                    className={`flex items-center justify-between px-5 sm:px-6 py-4 ${
                      i < exam.comparison.length - 1 ? "border-b border-white/[0.03]" : ""
                    } ${!item.available ? "opacity-60" : ""}`}
                  >
                    <span className="text-sm text-[#c0c0c0]">{item.feature}</span>
                    <span>
                      {item.available ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[#555566]" />
                      )}
                    </span>
                  </div>
                ))}
              </m.div>

              <m.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mt-6"
              >
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 text-sm text-[#00D2FF] hover:text-[#3D81E3] transition-colors"
                >
                  Start with a free mock test <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </m.div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* STUDY TIPS */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 md:py-24 relative overflow-hidden">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
                  Study Tips
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
                  Tips to <span className="text-gradient">Prepare Better</span>
                </h2>
              </m.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {exam.studyTips.map((tip, i) => {
                  const Icon = iconMap[tip.icon] || Lightbulb;
                  const gradients = [
                    "from-[#3D81E3] to-[#00D2FF]",
                    "from-[#00D2FF] to-[#A4F4FD]",
                    "from-[#A4F4FD] to-[#3D81E3]",
                    "from-[#3D81E3] to-[#A4F4FD]",
                    "from-[#00D2FF] to-[#3D81E3]",
                    "from-[#A4F4FD] to-[#00D2FF]",
                  ];
                  return (
                    <m.div
                      key={tip.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.5 }}
                      whileHover={{ y: -4 }}
                      className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-[#f5f5f7] mb-1.5">{tip.title}</h3>
                      <p className="text-xs text-[#888899] leading-relaxed">{tip.desc}</p>
                    </m.div>
                  );
                })}
              </div>

              <m.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mt-10"
              >
                <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-[#00D2FF]/5 border border-[#00D2FF]/10">
                  <Brain className="w-5 h-5 text-[#00D2FF]" />
                  <span className="text-sm text-[#c0c0c0]">
                    Test your knowledge instantly with our{" "}
                    <button
                      onClick={() => setQuizOpen(true)}
                      className="text-[#00D2FF] hover:text-[#3D81E3] underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      AI Quiz Generator
                    </button>
                  </span>
                </div>
              </m.div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* FAQ SECTION */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#0d0d15]/30 to-transparent">
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
                  FAQ
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
                  Frequently Asked <span className="text-gradient">Questions</span>
                </h2>
              </m.div>

              <div className="space-y-3">
                {exam.faqs.map((faq, i) => (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl border transition-all duration-300 cursor-pointer ${
                      openFaq === i
                        ? "border-[#3D81E3]/20 bg-gradient-to-r from-[#3D81E3]/5 to-transparent"
                        : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.06]"
                    }`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="flex items-center justify-between px-6 py-5">
                      <span className="text-sm sm:text-base font-semibold text-[#f5f5f7] pr-4">
                        {faq.q}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-[#888899] shrink-0 transition-all duration-300 ${
                        openFaq === i ? "rotate-180 text-[#00D2FF]" : ""
                      }`} />
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <m.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-5 text-sm text-[#888899] leading-relaxed border-t border-[#3D81E3]/10 pt-4">
                            {faq.a}
                          </p>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </m.div>
                ))}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* CTA SECTION */}
          {/* ════════════════════════════════════════ */}
          <section className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3D81E3]/20 via-[#0d0d15] to-[#0C0C0C]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzRDgxRTMiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNFYzMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            <div className="absolute -top-40 right-20 w-[400px] h-[400px] rounded-full bg-[#00D2FF]/10 blur-[120px] animate-orb" />
            <div className="absolute -bottom-40 left-20 w-[350px] h-[350px] rounded-full bg-[#3D81E3]/8 blur-[100px] animate-orb" style={{ animationDelay: "5s" }} />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <m.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-heading text-[#f5f5f7] leading-[1.15]">
                  Ready to Start{" "}
                  <span className="text-gradient">Practicing?</span>
                </h2>
                <p className="mt-6 text-base sm:text-lg text-[#888899] max-w-2xl mx-auto">
                  Create your free account and start practicing with AI-generated mock tests today.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center gap-2 h-12 px-8 rounded-2xl text-sm font-semibold text-white overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    <span className="relative flex items-center gap-2">
                      Get Started Free <Sparkles className="w-4 h-4" />
                    </span>
                  </Link>
                  <Link
                    href="/discover"
                    className="group inline-flex items-center gap-2 h-12 px-8 rounded-2xl text-sm font-semibold text-[#f5f5f7] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                  >
                    Explore Tests <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </m.div>
            </div>
          </section>

          {/* ════════════════════════════════════════ */}
          {/* FEEDBACK CAROUSEL */}
          {/* ════════════════════════════════════════ */}
          <QuizFeedbackCarousel />

          {/* ════════════════════════════════════════ */}
          {/* CONTACT FORM */}
          {/* ════════════════════════════════════════ */}
          <ExamContactForm examName={exam.examFullName} />
        </main>

        <Footer />

        {/* ════════════════════════════════════════ */}
        {/* QUIZ MODAL */}
        {/* ════════════════════════════════════════ */}
        <QuizModal isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
      </div>
    </LazyMotion>
  );
}
