"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { Lightbulb, Zap, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: Lightbulb,
    title: "Save Time",
    desc: "No manual question entry required. Upload any paper and get an instant mock test.",
    gradient: "from-[#3D81E3] to-[#00D2FF]",
  },
  {
    icon: Zap,
    title: "Learn Faster",
    desc: "AI identifies weak areas instantly and helps you focus on what matters most.",
    gradient: "from-[#00D2FF] to-[#A4F4FD]",
  },
  {
    icon: TrendingUp,
    title: "Improve Scores",
    desc: "Practice with real question papers and track your improvement over time.",
    gradient: "from-[#A4F4FD] to-[#3D81E3]",
  },
];

const stats = [
  { label: "Questions Analyzed" },
  { label: "Mock Tests Generated" },
  { label: "100% Free Access" },
];

export default function StudentBenefits() {
  return (
    <LazyMotion features={domAnimation}>
    <section className="py-16 md:py-24 lg:py-28 relative overflow-hidden bg-[#0d0d15]/30">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C] via-transparent to-[#0C0C0C] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
className="text-center mb-12 md:mb-16"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
              Benefits
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            Built <span className="text-gradient">For Students</span>
          </h2>
        </m.div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-12 md:mb-16">
          {benefits.map((benefit, i) => (
            <m.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500 text-center"
            >
              <div className="relative inline-flex">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#3D81E3]/20 to-[#00D2FF]/20 blur-xl" />
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-500`}>
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#f5f5f7] mb-2 sm:mb-3">{benefit.title}</h3>
              <p className="text-sm text-[#888899] leading-relaxed">{benefit.desc}</p>
            </m.div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-xl sm:text-3xl md:text-4xl font-bold font-heading text-[#f5f5f7]">
                {stat.label}
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
    </LazyMotion>
  );
}
