"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is FOURI completely free?",
    a: "Yes! FOURI is 100% free for all Indian students. You can upload unlimited question papers, generate unlimited mock tests, and access all features without paying anything. No credit card required.",
  },
  {
    q: "Which file formats are supported?",
    a: "We support PDF, JPG, PNG, and JPEG formats. Our AI can also read handwritten scans and screenshots of question papers. Mobile photos of question papers work great too.",
  },
  {
    q: "Can AI read handwritten papers?",
    a: "Yes! Our AI uses advanced handwriting recognition powered by Google Vision API. It can read Bengali, Hindi, and English handwriting, though neat handwriting gives the best results.",
  },
  {
    q: "Does it support Bengali, Hindi & English?",
    a: "Absolutely. FOURI is built for Indian students and supports question papers in Bengali, Hindi, and English. Our AI can detect the language automatically and process questions accordingly.",
  },
  {
    q: "How accurate is the OCR?",
    a: "Our OCR achieves 95%+ accuracy for printed text and 85%+ for clear handwritten text. For printed question papers, the extraction is near-perfect. Results improve with higher quality scans.",
  },
  {
    q: "Which exams are supported?",
    a: "FOURI works with any exam format! It's optimized for JEE Main & Advanced, NEET UG, WBJEE, CUET, CBSE Board, WBCHSE, and other Indian competitive exams. The AI automatically detects the exam pattern.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-300 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            Got Questions?
            <br />
            <span className="text-gradient">We Have Answers</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border transition-all duration-300 cursor-pointer ${
                open === i
                  ? "border-blue-500/30 bg-blue-500/5 shadow-sm"
                  : "border-white/5 bg-[#111118] hover:border-white/10 hover:shadow-sm"
              }`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex items-center justify-between px-6 py-5">
                <span className="text-sm sm:text-base font-semibold text-[#f5f5f7] pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#888899] shrink-0 transition-transform duration-300 ${
                    open === i ? "rotate-180 text-blue-400" : ""
                  }`}
                />
              </div>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-[#888899] leading-relaxed border-t border-blue-500/10 pt-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
