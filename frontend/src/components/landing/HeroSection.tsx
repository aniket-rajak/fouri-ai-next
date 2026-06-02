"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Play,
  ShieldCheck,
  Zap,
  Eye,
  Brain,
  Clock,
  Target,
  BarChart3,
} from "lucide-react";
import { LazyLightPillar } from "./LazyLightPillar";
import CardSwap, { Card } from "@/components/ui/CardSwap";

const trustIndicators = [
  { icon: ShieldCheck, label: "Completely Free" },
  { icon: Zap, label: "AI Powered" },
  { icon: Eye, label: "Student First" },
];

const swapCards = [
  {
    icon: Brain,
    image: "/assets/images/hero/hero-1.jpg",
    value: "100+",
    label: "Questions Extracted",
    sub: "from any uploaded paper",
    gradient: "from-[#3D81E3]/20 to-[#00D2FF]/10",
    iconColor: "#00D2FF",
  },
  {
    icon: BarChart3,
    image: "/assets/images/hero/hero-2.jpg",
    value: "AI",
    label: "Powered Analysis",
    sub: "intelligent evaluation",
    gradient: "from-[#A4F4FD]/20 to-[#3D81E3]/10",
    iconColor: "#A4F4FD",
  },
  {
    icon: Target,
    image: "/assets/images/hero/hero-3.jpg",
    value: "45 min",
    label: "Mock Test Duration",
    sub: "timed & adaptive",
    gradient: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "#4ade80",
  },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0C0C0C] pt-10 lg:pt-16">
      <LazyLightPillar
          topColor="#3D81E3"
          bottomColor="#00D2FF"
          intensity={0.5}
          rotationSpeed={0.15}
          glowAmount={0.003}
          pillarWidth={5}
          pillarHeight={0.3}
          noiseIntensity={0.15}
          pillarRotation={10}
          interactive={false}
          mixBlendMode="screen"
          quality="high"
        />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzRDgxRTMiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGc+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNFYzMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse-ring" />
              <span className="text-xs font-medium text-[#888899] tracking-wide">
                AI-Powered Exam Preparation
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-heading tracking-tight leading-[1.1]">
              <span className="text-[#f5f5f7]">
                Transform Any Question Paper Into an
              </span>{" "}
              <span className="bg-gradient-to-r from-[#3D81E3] via-[#00D2FF] to-[#A4F4FD] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                AI Mock Test
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#888899] leading-relaxed max-w-xl">
              Upload your question paper and let FOURI AI instantly generate
              mock tests, evaluate answers, and provide personalized performance
              insights.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                <Play className="w-4 h-4 text-[#00D2FF]" />
                Watch Demo
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              {trustIndicators.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#00D2FF]" />
                    <span className="text-xs text-[#888899]">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="relative hidden lg:block"
            // style={{ height: 280 }}
            style={{ height: 400 }}
          >
            <div className="relative w-full h-full">
              <CardSwap
                width={420}
                height={400}
                cardDistance={55}
                verticalDistance={75}
                delay={4500}
                pauseOnHover={false}
                skewAmount={5}
                easing="elastic"
              >
                {swapCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <Card
                      key={i}
                      customClass="!border-white/[0.08] !bg-gradient-to-br !from-[#0C0C0C]/95 !to-[#151515]/90 !backdrop-blur-2xl !shadow-2xl !overflow-hidden"
                    >
                      <div className="flex flex-col h-full">
                        <div className="relative h-[45%] min-h-[140px] overflow-hidden">
                          <img
                            src={card.image}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(180deg, transparent 50%, ${card.iconColor}15 100%)`,
                            }}
                          />
                        </div>
                        <div className="flex-1 p-5 flex flex-col justify-center">
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${card.iconColor}20, ${card.iconColor}08)`,
                              }}
                            >
                              <Icon
                                className="w-4 h-4"
                                style={{ color: card.iconColor }}
                              />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-[#666677] font-medium truncate">
                              {card.label}
                            </span>
                          </div>
                          <span className="text-3xl sm:text-4xl font-bold text-[#f5f5f7] leading-tight">
                            {card.value}
                          </span>
                          <span className="text-xs text-[#888899] mt-1.5">
                            {card.sub}
                          </span>
                        </div>
                        <div
                          className="absolute bottom-0 left-0 right-0 h-px"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${card.iconColor}40, transparent)`,
                          }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </CardSwap>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
