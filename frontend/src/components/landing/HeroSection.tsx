"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Upload, Brain, FileCheck, BarChart3, Sparkles, ArrowRight,
  ChevronLeft, ChevronRight, Zap, Target, Shield,
} from "lucide-react";

const slides = [
  {
    tag: "AI-Powered Exam Prep",
    headline: "Upload Question Papers.\nGet AI Mock Tests Instantly.",
    body: "FOURI uses advanced AI to analyze your exam papers, extract questions, detect important topics, and generate personalized mock tests for smarter preparation.",
    cta: "Upload Question Paper",
    ctaLink: "/register",
    ctaIcon: Upload,
    secondaryCta: "Try Demo",
    secondaryLink: "/discover",
    image: "/assets/images/hero/hero-1.jpg",
    floatingCards: [
      { icon: FileCheck, label: "125 Questions Extracted", color: "from-emerald-500 to-emerald-600", x: "8%", y: "20%", delay: 0.3 },
      { icon: Brain, label: "AI Analysis Complete", color: "from-blue-500 to-blue-600", x: "58%", y: "8%", delay: 0.5 },
      { icon: Sparkles, label: "Mock Test Generated", color: "from-amber-500 to-amber-600", x: "5%", y: "58%", delay: 0.7 },
    ],
  },
  {
    tag: "Smart OCR Technology",
    headline: "AI Reads Any Paper.\nHandwritten or Printed.",
    body: "Advanced OCR extracts every question from your uploaded papers — even handwritten notes in Bengali, Hindi, and English. No typing required.",
    cta: "Try OCR Now",
    ctaLink: "/register",
    ctaIcon: FileCheck,
    secondaryCta: "See How It Works",
    secondaryLink: "#how-it-works",
    image: "/assets/images/hero/hero-2.jpg",
    floatingCards: [
      { icon: Zap, label: "95% OCR Accuracy", color: "from-blue-500 to-cyan-600", x: "10%", y: "15%", delay: 0.3 },
      { icon: Target, label: "Handwriting Detection", color: "from-violet-500 to-purple-600", x: "55%", y: "10%", delay: 0.5 },
      { icon: Shield, label: "Multi-Language Support", color: "from-emerald-500 to-teal-600", x: "8%", y: "55%", delay: 0.7 },
    ],
  },
  {
    tag: "Personalized Learning",
    headline: "Every Test Adapts\nto Your Level.",
    body: "AI analyzes your performance, identifies weak areas, and generates targeted practice tests. Focus on what matters most for your exam.",
    cta: "Start Practice",
    ctaLink: "/register",
    ctaIcon: Target,
    secondaryCta: "View Analytics",
    secondaryLink: "#features",
    image: "/assets/images/hero/hero-3.jpg",
    floatingCards: [
      { icon: BarChart3, label: "Performance Insights", color: "from-blue-500 to-indigo-600", x: "12%", y: "12%", delay: 0.3 },
      { icon: Brain, label: "Weak Area Detection", color: "from-rose-500 to-pink-600", x: "52%", y: "15%", delay: 0.5 },
      { icon: Sparkles, label: "Smart Recommendations", color: "from-amber-500 to-orange-600", x: "6%", y: "60%", delay: 0.7 },
    ],
  },
  {
    tag: "Comprehensive Exams",
    headline: "JEE, NEET, WBJEE, CUET\n& Board Exams Covered.",
    body: "Upload papers from any Indian exam. Our AI automatically detects the exam pattern, subject, and difficulty level to create the perfect practice test.",
    cta: "Explore Exams",
    ctaLink: "/discover",
    ctaIcon: BarChart3,
    secondaryCta: "Upload Paper",
    secondaryLink: "/register",
    image: "/assets/images/hero/hero-4.jpg",
    floatingCards: [
      { icon: FileCheck, label: "JEE Pattern Detected", color: "from-blue-500 to-blue-600", x: "8%", y: "18%", delay: 0.3 },
      { icon: Brain, label: "NEET Questions Sorted", color: "from-emerald-500 to-green-600", x: "55%", y: "8%", delay: 0.5 },
      { icon: Sparkles, label: "WBJEE Ready", color: "from-violet-500 to-purple-600", x: "10%", y: "55%", delay: 0.7 },
    ],
  },
  {
    tag: "Zero Cost Learning",
    headline: "100% Free.\nNo Hidden Charges. Ever.",
    body: "Education should be accessible to all. Upload unlimited papers, generate unlimited mock tests, and access all features — completely free for every Indian student.",
    cta: "Get Started Free",
    ctaLink: "/register",
    ctaIcon: Sparkles,
    secondaryCta: "Learn More",
    secondaryLink: "#features",
    image: "/assets/images/hero/hero-3.jpg",
    floatingCards: [
      { icon: Shield, label: "No Credit Card", color: "from-blue-500 to-cyan-600", x: "12%", y: "15%", delay: 0.3 },
      { icon: Sparkles, label: "Unlimited Tests", color: "from-amber-500 to-orange-600", x: "52%", y: "12%", delay: 0.5 },
      { icon: Brain, label: "All Features Free", color: "from-emerald-500 to-teal-600", x: "8%", y: "58%", delay: 0.7 },
    ],
  },
  {
    tag: "Instant Feedback",
    headline: "Detailed Explanations\nfor Every Question.",
    body: "AI generates step-by-step explanations for every answer. Understand concepts, learn from mistakes, and improve with each practice session.",
    cta: "Start Learning",
    ctaLink: "/register",
    ctaIcon: Brain,
    secondaryCta: "See Example",
    secondaryLink: "#mock-tests",
    image: "/assets/images/hero/hero-5.jpg",
    floatingCards: [
      { icon: FileCheck, label: "Step-by-Step Answers", color: "from-blue-500 to-indigo-600", x: "10%", y: "10%", delay: 0.3 },
      { icon: BarChart3, label: "Performance Trends", color: "from-violet-500 to-purple-600", x: "55%", y: "15%", delay: 0.5 },
      { icon: Brain, label: "Concept Explanations", color: "from-emerald-500 to-teal-600", x: "6%", y: "60%", delay: 0.7 },
    ],
  },
];

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSlides = slides.length;

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % totalSlides);
    }, 6000);
  }, [totalSlides]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  const goTo = (idx: number) => {
    stopAutoPlay();
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    setTimeout(() => startAutoPlay(), 8000);
  };

  const goNext = () => {
    stopAutoPlay();
    setDirection(1);
    setCurrent((prev) => (prev + 1) % totalSlides);
    setTimeout(() => startAutoPlay(), 8000);
  };

  const goPrev = () => {
    stopAutoPlay();
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => startAutoPlay(), 8000);
  };

  const easeCurve: [number, number, number, number] = [0.32, 0.72, 0, 1];
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: easeCurve },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.5, ease: easeCurve },
    }),
  };

  const slide = slides[current];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#08080f]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px]" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-400/3 blur-[80px] animate-blob" />
        <div className="absolute top-1/2 right-1/3 w-[250px] h-[250px] rounded-full bg-indigo-500/3 blur-[80px] animate-blob" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
            >
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="relative z-10"
              >
                <motion.div
                  variants={fadeUp}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-6"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium text-blue-300">
                    {slide.tag}
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-heading tracking-tight leading-[1.1]"
                >
                  {slide.headline.split("\n").map((line, i) => (
                    <span key={i}>
                      {i === 1 ? (
                        <span className="text-gradient">{line}</span>
                      ) : (
                        <span className="text-[#f5f5f7]">{line}</span>
                      )}
                      {i === 0 && <br />}
                    </span>
                  ))}
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="mt-6 text-base sm:text-lg text-[#888899] leading-relaxed max-w-lg"
                >
                  {slide.body}
                </motion.p>

                <motion.div
                  variants={fadeUp}
                  className="mt-8 flex flex-col sm:flex-row gap-4"
                >
                  <Link
                    href={slide.ctaLink}
                    className="group relative inline-flex items-center justify-center h-14 px-8 rounded-2xl font-semibold text-white overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-blue-600 transition-all duration-500 group-hover:bg-blue-500" />
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-600 to-blue-400" />
                    <span className="relative flex items-center gap-2 text-sm sm:text-base">
                      {slide.cta}
                      <slide.ctaIcon className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                  <Link
                    href={slide.secondaryLink}
                    className="group inline-flex items-center justify-center h-14 px-8 rounded-2xl font-semibold text-blue-300 glass-light hover:bg-white/5 hover:border-blue-500/30 transition-all border border-white/5"
                  >
                    {slide.secondaryCta}
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                variants={scaleIn}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/5 border border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent z-10" />
                  <img
                    src={slide.image}
                    alt=""
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                </div>

                {slide.floatingCards.map((card) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8 + card.delay, duration: 0.5, ease: "easeOut" }}
                    className="absolute hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass shadow-xl border border-white/5"
                    style={{ left: card.x, top: card.y }}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                      <card.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-[#f5f5f7] whitespace-nowrap">
                      {card.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-10 relative z-10">
          <div className="flex items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`relative h-1.5 rounded-full transition-all duration-700 cursor-pointer ${
                  i === current
                    ? "w-10 bg-blue-500 shadow-lg shadow-blue-500/30"
                    : "w-2 bg-white/10 hover:bg-white/20"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-xl glass-light flex items-center justify-center hover:bg-white/5 hover:border-blue-500/30 transition-all border border-white/5 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 text-[#888899]" />
            </button>
            <button
              onClick={goNext}
              className="w-10 h-10 rounded-xl glass-light flex items-center justify-center hover:bg-white/5 hover:border-blue-500/30 transition-all border border-white/5 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 text-[#888899]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
