"use client";

import { useState } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Is FOURI completely free?", a: "Yes! FOURI is 100% free for all students. There are no hidden charges, subscription fees, or premium plans. Every feature is available at no cost." },
  { q: "Which file formats are supported?", a: "We support PDF, JPG, PNG, and JPEG formats. Our AI can handle both printed and handwritten content in these formats." },
  { q: "Can AI read handwritten papers?", a: "Yes! Our AI uses advanced handwriting recognition that supports Bengali, Hindi, and English handwriting with high accuracy." },
  { q: "Does it support Bengali, Hindi & English?", a: "Absolutely. FOURI is built for Indian students and fully supports Bengali, Hindi, and English languages for both OCR and question analysis." },
  { q: "How accurate is the OCR?", a: "Our OCR achieves 95%+ accuracy for printed text and 85%+ for clear handwritten text. Accuracy improves with higher quality uploads." },
  { q: "Which exams are supported?", a: "FOURI works with any exam format! JEE, NEET, WBJEE, CUET, CBSE boards, UPSC, and more. Our AI automatically detects the exam pattern." },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <LazyMotion features={domAnimation}>
    <section id="faq" className="py-16 md:py-24 lg:py-28 relative overflow-hidden">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-14"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            Got Questions? <span className="text-gradient">We Have Answers</span>
          </h2>
        </m.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border transition-all duration-300 cursor-pointer ${
                open === i
                  ? "border-[#3D81E3]/20 bg-gradient-to-r from-[#3D81E3]/5 to-transparent"
                  : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.06]"
              }`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex items-center justify-between px-6 py-5">
                <span className="text-sm sm:text-base font-semibold text-[#f5f5f7] pr-4">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-[#888899] shrink-0 transition-all duration-300 ${open === i ? "rotate-180 text-[#00D2FF]" : ""}`} />
              </div>
              <AnimatePresence>
                {open === i && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-[#888899] leading-relaxed border-t border-[#3D81E3]/10 pt-4">
                      {faq.a}
                    </p>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          ))}
        </div>
      </div>
    </section>
    </LazyMotion>
  );
}
