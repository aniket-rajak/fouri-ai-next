"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, Brain, FileSearch, Tags, BarChart3, Layers } from "lucide-react";

const features = [
  { icon: FileSearch, label: "OCR Extraction", desc: "Extract text from printed & handwritten papers" },
  { icon: Brain, label: "Handwriting Detection", desc: "AI recognizes Bengali, Hindi & English handwriting" },
  { icon: Tags, label: "Topic Categorization", desc: "Auto-sorts questions by chapter & subject" },
  { icon: BarChart3, label: "Important Question Detection", desc: "Identifies high-weightage & repeated questions" },
  { icon: Layers, label: "Exam Pattern Analysis", desc: "Recognizes JEE, NEET, WBJEE, CUET & board patterns" },
  { icon: CheckCircle2, label: "Difficulty Level Detection", desc: "Classifies each question as Easy, Medium, or Hard" },
];

export default function AIAnalysis() {
  return (
    <section id="ai-analysis" className="py-20 md:py-28 bg-[#0d0d15]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/5 border border-white/5">
              <Image
                src="/assets/images/ai-analysis/ai-analysis.jpg"
                alt="AI analysis dashboard"
                width={800}
                height={600}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -bottom-4 -right-4 glass rounded-2xl p-4 shadow-xl border border-white/5 hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#888899]">AI Processing</p>
                  <p className="text-sm font-bold text-[#f5f5f7]">95% Accuracy</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-blue-300 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">
              AI Analysis
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7] leading-tight">
              AI-Powered Question Paper Intelligence
            </h2>
            <p className="mt-4 text-[#888899] leading-relaxed max-w-lg">
              Our AI doesn&apos;t just read text — it understands exam patterns,
              categorizes questions, and intelligently analyzes difficulty to
              create the perfect practice test.
            </p>

            <div className="mt-8 space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-500/20 transition-colors">
                    <f.icon className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f5f5f7]">{f.label}</p>
                    <p className="text-xs text-[#888899]">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
