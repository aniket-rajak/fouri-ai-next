"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import Link from "next/link";
import { Sparkles, CheckCircle2, Infinity, BarChart3, Brain, LayoutDashboard, Zap } from "lucide-react";

const freeFeatures = [
  "Unlimited Mock Tests",
  "AI Question Analysis",
  "Performance Reports",
  "Answer Evaluation",
  "Student Dashboard",
  "Future Updates",
];

export default function FreeAccess() {
  return (
    <LazyMotion features={domAnimation}>
    <section className="py-16 md:py-24 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d15] to-[#0C0C0C] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-12"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            Always Free <span className="text-gradient">For Students</span>
          </h2>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-lg mx-auto"
        >
          <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-[#3D81E3] via-[#00D2FF] to-[#A4F4FD] opacity-30 blur-sm animate-gradient-shift" />
          <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-[#3D81E3] via-[#00D2FF] to-[#A4F4FD] opacity-20 animate-gradient-shift" />
          <div className="relative p-8 rounded-3xl bg-[#0d0d15] border border-white/[0.04]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] text-[10px] font-semibold text-white shadow-lg">
              No Hidden Charges
            </div>

            <div className="text-center mt-4">
              <span className="text-[#888899] text-sm">Starting at</span>
              <div className="text-6xl sm:text-7xl font-bold font-heading text-[#f5f5f7] mt-2">
                ₹<span className="text-gradient">0</span>
              </div>
              <p className="text-[#888899] text-xs mt-2">Completely free for all students</p>
            </div>

            <div className="mt-8 space-y-3">
              {freeFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <CheckCircle2 className="w-4 h-4 text-[#00D2FF] shrink-0" />
                  <span className="text-sm text-[#f5f5f7]">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/register"
                className="group relative flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-sm font-semibold text-white overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  Start Learning Free <Sparkles className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </m.div>
      </div>
    </section>
    </LazyMotion>
  );
}
