"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, GraduationCap, Brain, FileText } from "lucide-react";

export default function CTABanner() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-[#0d0d15] to-[#08080f]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-blob" />
      <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-blue-300/5 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center gap-4 mb-8"
        >
          {[GraduationCap, Brain, FileText].map((Icon, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <Icon className="w-6 h-6 text-blue-300" />
            </motion.div>
          ))}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-[#f5f5f7] leading-tight"
        >
          Master Any Exam with AI
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-lg text-[#888899] max-w-xl mx-auto"
        >
          Upload once. Practice endlessly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 h-14 px-10 rounded-2xl bg-blue-600 text-white font-bold text-base hover:bg-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-500/25 hover:scale-105 active:scale-95"
          >
            Generate Free Mock Test
            <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-sm text-[#888899]/70"
        >
          No credit card required. 100% free for all Indian students.
        </motion.p>
      </div>
    </section>
  );
}
