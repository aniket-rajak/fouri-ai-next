"use client";

import { motion } from "framer-motion";

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

interface Props {
  cards: StatCard[];
}

export default function StatsCardGrid({ cards }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-[#111118] rounded-2xl border border-white/5 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#888899] font-medium">{card.label}</span>
            <span className={`p-2 rounded-lg ${card.color}`}>{card.icon}</span>
          </div>
          <div className="text-2xl font-bold text-[#f5f5f7]">{card.value}</div>
          {card.subtitle && (
            <div className="text-xs text-[#666677] mt-1">{card.subtitle}</div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
