"use client";

import { motion } from "framer-motion";
import { Upload, Brain, FileText, BarChart3 } from "lucide-react";

const cards = [
  {
    icon: Upload,
    title: "Upload Papers",
    desc: "Drag & drop any question paper — PDF, images, or handwritten scans. Our AI accepts all formats.",
    gradient: "from-[#111118] to-[#0d0d15]",
    iconBg: "from-blue-600 to-blue-500",
    border: "border-blue-500/10",
  },
  {
    icon: Brain,
    title: "AI Extracts Questions",
    desc: "Advanced OCR + AI reads every question, identifies MCQs, subjective answers, and diagrams.",
    gradient: "from-[#111118] to-[#0d0d15]",
    iconBg: "from-violet-600 to-purple-500",
    border: "border-violet-500/10",
  },
  {
    icon: FileText,
    title: "Auto Generate Mock Tests",
    desc: "Questions are categorized, timed, and turned into a full-length practice test automatically.",
    gradient: "from-[#111118] to-[#0d0d15]",
    iconBg: "from-cyan-600 to-teal-500",
    border: "border-cyan-500/10",
  },
  {
    icon: BarChart3,
    title: "Practice & Analyze",
    desc: "Take tests, review answers with AI explanations, track your progress across subjects.",
    gradient: "from-[#111118] to-[#0d0d15]",
    iconBg: "from-amber-600 to-orange-500",
    border: "border-amber-500/10",
  },
];

export default function WhatFouriDoes() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#08080f] via-[#0d0d15] to-[#08080f] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-300 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">
            What FOURI Does
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            Transform Old Question Papers
            <br />
            <span className="text-gradient">into Smart Practice</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className={`group relative p-8 rounded-3xl bg-gradient-to-br ${card.gradient} border ${card.border} hover:border-blue-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <card.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#f5f5f7] mb-3">{card.title}</h3>
              <p className="text-sm text-[#888899] leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
