"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Target, Brain, FileText } from "lucide-react";

const metrics = [
  { label: "Accuracy", value: "87%", color: "text-emerald-400", ring: "conic-gradient(from 0deg, #10b981, #34d399, #6ee7b7, #10b981)" },
  { label: "Score", value: "156/180", color: "text-blue-400", ring: "conic-gradient(from 0deg, #3b82f6, #60a5fa, #93c5fd, #3b82f6)" },
  { label: "Time", value: "42 min", color: "text-amber-400", ring: "conic-gradient(from 0deg, #f59e0b, #fbbf24, #fcd34d, #f59e0b)" },
];

const subjectPerformance = [
  { subject: "Physics", correct: 18, total: 25, color: "bg-[#3D81E3]" },
  { subject: "Chemistry", correct: 22, total: 25, color: "bg-[#00D2FF]" },
  { subject: "Mathematics", correct: 15, total: 25, color: "bg-[#A4F4FD]" },
];

export default function AIDashboardShowcase() {
  return (
    <section id="mock-tests" className="py-16 md:py-24 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C] via-[#0d0d15] to-[#0C0C0C] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #3D81E3 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
            Dashboard
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            AI-Powered <span className="text-gradient">Analytics Dashboard</span>
          </h2>
          <p className="mt-3 text-[#888899] text-sm sm:text-base max-w-lg mx-auto">
            Track every aspect of your performance with intelligent insights
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3D81E3]/20 to-[#00D2FF]/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#00D2FF]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#f5f5f7]">Uploaded Paper</p>
                  <p className="text-[10px] text-[#888899]">JEE Main 2025 Physics</p>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-medium text-emerald-400 border border-emerald-500/10">Analyzed</span>
              </div>
              <div className="space-y-2">
                {["Question 1: Kinematics", "Question 2: Thermodynamics", "Question 3: Electrostatics", "Question 4: Optics", "Question 5: Modern Physics"].map((q, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-[#888899] truncate">{q}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-[#888899] text-center">+ 20 more questions extracted</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-1"
          >
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00D2FF]/20 to-[#A4F4FD]/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-[#A4F4FD]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#f5f5f7]">Generated Mock Test</p>
                  <p className="text-[10px] text-[#888899]">25 Questions | 45 Minutes</p>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-medium text-blue-400 border border-blue-500/10">Ready</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                  <span className="text-[11px] text-[#f5f5f7] font-medium">Section A: Physics</span>
                  <span className="text-[10px] text-[#888899]">15 Questions</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                  <span className="text-[11px] text-[#f5f5f7] font-medium">Section B: Chemistry</span>
                  <span className="text-[10px] text-[#888899]">10 Questions</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                <Clock className="w-3 h-3 text-[#00D2FF]" />
                <span className="text-[11px] text-[#888899]">Estimated time: 45 minutes</span>
              </div>
              <div className="mt-2 flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                <Target className="w-3 h-3 text-[#3D81E3]" />
                <span className="text-[11px] text-[#888899]">Difficulty: Mixed</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#A4F4FD]/20 to-[#3D81E3]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#3D81E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#f5f5f7]">Performance Analytics</p>
                  <p className="text-[10px] text-[#888899]">Real-time insights</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {metrics.map((m) => (
                  <div key={m.label} className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                    <p className={`text-sm font-bold font-heading ${m.color}`}>{m.value}</p>
                    <p className="text-[9px] text-[#888899] mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-[#888899] uppercase tracking-wider mb-2">Subject Performance</p>
                {subjectPerformance.map((s) => (
                  <div key={s.subject} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#f5f5f7]">{s.subject}</span>
                      <span className="text-[10px] text-[#888899]">{s.correct}/{s.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(s.correct / s.total) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${s.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
