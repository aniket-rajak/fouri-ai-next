"use client";

import { motion } from "framer-motion";
import { Upload, Brain, FileCheck, Sparkles, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Paper",
    desc: "Upload any past question paper in PDF, JPG, or PNG format. Handwritten or printed — AI handles both.",
    gradient: "from-blue-600 to-blue-500",
  },
  {
    icon: Brain,
    title: "AI Reads Questions",
    desc: "Advanced OCR extracts every question, detects MCQs vs subjective, and understands the layout.",
    gradient: "from-violet-600 to-purple-500",
  },
  {
    icon: FileCheck,
    title: "Questions Organized",
    desc: "Questions are categorized by subject, topic, and difficulty level automatically.",
    gradient: "from-cyan-600 to-teal-500",
  },
  {
    icon: Sparkles,
    title: "Mock Test Generated",
    desc: "A timed, interactive mock test is created with all questions, options, and answer keys.",
    gradient: "from-amber-600 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Practice & Improve",
    desc: "Take the test, review AI-generated explanations, and track your performance over time.",
    gradient: "from-emerald-600 to-emerald-500",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#08080f] to-[#0d0d15] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-300 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            From Paper to Practice in
            <br />
            <span className="text-gradient">5 Simple Steps</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative group"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[55%] w-[90%]">
                  <div className="h-px bg-gradient-to-r from-blue-500/20 to-blue-500/10" />
                </div>
              )}
              <div className="relative flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-500`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="mt-5 text-base font-bold text-[#f5f5f7]">{step.title}</h3>
                <p className="mt-2 text-xs text-[#888899] leading-relaxed max-w-[200px]">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
