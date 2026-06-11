"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { steps } from "@/data/howItWorks";
import type { HowItWorksStep } from "@/data/howItWorks";

function GlassCard({ step, i, compact }: { step: HowItWorksStep; i: number; compact?: boolean }) {
  return (
    <div
      className={`
        backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-xl shadow-xl
        transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/5
        relative overflow-hidden
      `}
    >
      <div className="absolute inset-0 rounded-xl pointer-events-none" />
      <div className={compact ? "p-4" : "p-5 md:p-7"}>
        <span className="text-[10px] font-bold tracking-widest text-[#00D2FF]">
          STEP 0{i + 1}
        </span>
        <h3
          className={`mt-2 font-bold text-[#f5f5f7] ${compact ? "text-base" : "text-lg md:text-xl"}`}
        >
          {step.title}
        </h3>
        <p
          className={`mt-2 text-[#888899] leading-relaxed ${compact ? "text-xs" : "text-sm"}`}
        >
          {step.desc}
        </p>
      </div>
    </div>
  );
}

const iconFloating = {
  y: [0, -5, 0],
};

const iconTransition = {
  duration: 3,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

export default function HowItWorks() {
  return (
    <LazyMotion features={domAnimation}>
      <section
        id="how-it-works"
        className="py-16 md:py-24 lg:py-28 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C] via-[#0d0d15] to-[#0C0C0C] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="text-center mb-12 md:mb-16 lg:mb-20"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
              How It Works
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
              4 Simple Steps
            </h2>
            <p className="mt-3 text-[#888899] text-sm sm:text-base max-w-lg mx-auto">
              From Question Paper To Performance Analytics
            </p>
          </m.div>

          <div className="relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#3D81E3]/40 via-[#00D2FF]/20 to-transparent -translate-x-1/2" />

            {steps.map((step, i) => (
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
                    <div className="w-full max-w-md">
                      <GlassCard step={step} i={i} />
                    </div>
                  )}
                </div>

                <m.div
                  animate={iconFloating}
                  transition={iconTransition}
                  className="relative z-10 flex-shrink-0 md:mx-auto"
                >
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg shadow-[#3D81E3]/20 ring-[3px] ring-[#0d0d15]`}
                  >
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                </m.div>

                <div className="hidden md:flex flex-1">
                  {i % 2 !== 0 && (
                    <div className="w-full max-w-md">
                      <GlassCard step={step} i={i} />
                    </div>
                  )}
                </div>

                <div className="flex md:hidden flex-1 min-w-0">
                  <GlassCard step={step} i={i} compact />
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
