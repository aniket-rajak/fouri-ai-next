"use client";

import { motion } from "framer-motion";
import { FileSearch, BrainCircuit, BarChart3, CheckSquare, PieChart, LayoutDashboard, Infinity, Smartphone } from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "AI Question Paper Analysis",
    desc: "Advanced OCR extracts text from printed and handwritten papers with 98%+ accuracy.",
    gradient: "from-[#3D81E3] to-[#00D2FF]",
    size: "md",
  },
  {
    icon: BrainCircuit,
    title: "Instant Mock Test Generation",
    desc: "Questions are automatically categorized, timed, and turned into full-length practice tests.",
    gradient: "from-[#00D2FF] to-[#A4F4FD]",
    size: "md",
  },
  {
    icon: BarChart3,
    title: "Smart Performance Reports",
    desc: "Detailed analytics with accuracy scores, time tracking, and progress over time.",
    gradient: "from-[#A4F4FD] to-[#3D81E3]",
    size: "md",
  },
  {
    icon: CheckSquare,
    title: "Answer Key Evaluation",
    desc: "AI evaluates both MCQ and subjective answers with detailed explanations for every question.",
    gradient: "from-[#3D81E3] to-[#A4F4FD]",
    size: "md",
  },
  {
    icon: PieChart,
    title: "Subject-wise Insights",
    desc: "Identify strengths and weaknesses across subjects, chapters, and difficulty levels.",
    gradient: "from-[#00D2FF] to-[#3D81E3]",
    size: "md",
  },
  {
    icon: LayoutDashboard,
    title: "Student Dashboard",
    desc: "Central hub to track all your tests, scores, and progress in one place.",
    gradient: "from-[#3D81E3] to-[#00D2FF]",
    size: "md",
  },
  {
    icon: Infinity,
    title: "Unlimited Practice",
    desc: "Generate as many mock tests as you want from any question paper — no limits.",
    gradient: "from-[#A4F4FD] to-[#00D2FF]",
    size: "md",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    desc: "Practice on any device with a fully responsive interface optimized for mobile and tablet.",
    gradient: "from-[#00D2FF] to-[#A4F4FD]",
    size: "md",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C] via-[#0d0d15] to-[#0C0C0C] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
            Features
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            Everything You Need <span className="text-gradient">To Prepare Better</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-[#f5f5f7] mb-2">{feature.title}</h3>
              <p className="text-xs text-[#888899] leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
