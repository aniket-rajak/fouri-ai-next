"use client";

import { motion } from "framer-motion";
import { Target, Eye, Sparkles } from "lucide-react";

export default function AboutSection() {
  return (
    <section className="py-16 md:py-24 lg:py-28 relative overflow-hidden bg-[#0d0d15]/30">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C] via-transparent to-[#0C0C0C] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
            About
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7] leading-tight">
            Created By <span className="text-gradient">Aniket Rajak</span>
          </h2>
          <p className="mt-3 text-[#888899] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            FOURI was created to simplify learning through Artificial Intelligence.
            It helps students transform traditional question papers into interactive mock tests
            with instant performance insights.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center"
          >
            <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#3D81E3] to-[#00D2FF] flex items-center justify-center shadow-lg mb-3 sm:mb-4">
              <Sparkles className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#f5f5f7]">Aniket Rajak</h3>
            <p className="text-xs text-[#00D2FF] mt-1">Founder & Developer</p>
            <p className="text-xs text-[#888899] mt-3 leading-relaxed">
              Building AI-powered tools to make quality education accessible to every student in India.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]"
          >
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-gradient-to-br from-[#00D2FF]/20 to-[#A4F4FD]/20 flex items-center justify-center mb-3 sm:mb-4">
              <Target className="w-4 sm:w-5 h-4 sm:h-5 text-[#00D2FF]" />
            </div>
            <h3 className="text-sm font-bold text-[#f5f5f7] mb-2">Our Mission</h3>
            <p className="text-xs text-[#888899] leading-relaxed">
              Making AI-Powered Learning Accessible To Every Student.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]"
          >
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-gradient-to-br from-[#A4F4FD]/20 to-[#3D81E3]/20 flex items-center justify-center mb-3 sm:mb-4">
              <Eye className="w-4 sm:w-5 h-4 sm:h-5 text-[#A4F4FD]" />
            </div>
            <h3 className="text-sm font-bold text-[#f5f5f7] mb-2">Our Vision</h3>
            <p className="text-xs text-[#888899] leading-relaxed">
              Free Quality Education Through Technology.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
