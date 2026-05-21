"use client";

import { motion } from "framer-motion";
import { Upload, FileSearch, Sparkles, BarChart3 } from "lucide-react";

const features = [
  { icon: Upload, label: "Upload Any Format", desc: "PDF, JPG, PNG, DOCX — even handwritten scans" },
  { icon: FileSearch, label: "AI OCR Extraction", desc: "99% accurate text extraction from any paper" },
  { icon: Sparkles, label: "Instant Mock Tests", desc: "Auto-generated tests with smart analytics" },
  { icon: BarChart3, label: "Smart Analytics", desc: "Chapter-wise insights & performance tracking" },
];

export default function FeatureBar() {
  return (
    <section className="relative">
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{f.label}</h3>
                  <p className="text-xs text-blue-100/80 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
