"use client";

import { FileText, Users, Percent, Sparkles } from "lucide-react";

const stats = [
  { icon: FileText, value: "50K+", label: "Questions Processed" },
  { icon: Users, value: "10K+", label: "Students" },
  { icon: Percent, value: "95%", label: "OCR Accuracy" },
  { icon: Sparkles, value: "1M+", label: "Mock Tests Generated" },
];

export default function StatsSection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-800/30 via-blue-900/20 to-[#08080f]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 50%, #3b82f6 0%, transparent 50%)" }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors group-hover:scale-110 transition-all duration-300 border border-blue-500/10">
                <stat.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-4xl sm:text-5xl font-bold font-heading text-[#f5f5f7]">
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-[#888899] font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
