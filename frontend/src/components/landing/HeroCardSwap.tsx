"use client";

import CardSwap, { Card } from "@/components/ui/CardSwap";
import Image from "next/image";
import { Brain, BarChart3, Target } from "lucide-react";

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

export default function HeroCardSwap() {
  return (
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
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover"
                    priority={i === 0}
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
  );
}
