"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#3D81E3]/20 via-[#0d0d15] to-[#0C0C0C]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzRDgxRTMiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNFYzMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <div className="absolute -top-40 right-20 w-[400px] h-[400px] rounded-full bg-[#00D2FF]/10 blur-[120px] animate-orb" />
      <div className="absolute -bottom-40 left-20 w-[350px] h-[350px] rounded-full bg-[#3D81E3]/8 blur-[100px] animate-orb" style={{ animationDelay: "5s" }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-heading text-[#f5f5f7] leading-[1.15]">
            Ready To Turn Your Question Papers Into{" "}
            <span className="text-gradient">Smart Practice Tests?</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#888899] max-w-2xl mx-auto">
            Join thousands of students using AI to study smarter every day. Start your journey to better grades today.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 h-12 px-8 rounded-2xl text-sm font-semibold text-white overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Start Free <Sparkles className="w-4 h-4" />
              </span>
            </Link>
            <Link
              href="/discover"
              className="group inline-flex items-center gap-2 h-12 px-8 rounded-2xl text-sm font-semibold text-[#f5f5f7] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
            >
              Explore Features <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
