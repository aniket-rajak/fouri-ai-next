"use client";

import { useState, useEffect, useCallback } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const EXAMPLES = [
  {
    role: "JEE Advanced Aspirant",
    review: "FOURI helped me practice previous year papers much faster than traditional methods. The AI analysis showed exactly where I was losing marks.",
    rating: 5,
    initials: "J",
    color: "from-[#3D81E3] to-[#00D2FF]",
  },
  {
    role: "NEET UG Aspirant",
    review: "The instant test generation from uploaded papers saves hours of manual work. The AI identifies weak areas and helps focus study efforts effectively.",
    rating: 5,
    initials: "N",
    color: "from-[#00D2FF] to-[#A4F4FD]",
  },
  {
    role: "WBJEE Aspirant",
    review: "Best free mock test platform I've used. The instant test generation from uploaded papers is a game changer for exam preparation.",
    rating: 5,
    initials: "W",
    color: "from-[#A4F4FD] to-[#3D81E3]",
  },
  {
    role: "CUET Aspirant",
    review: "The subject-wise insights helped me focus on my weak areas. I could track my progress and see real improvement over time.",
    rating: 5,
    initials: "C",
    color: "from-[#3D81E3] to-[#A4F4FD]",
  },
  {
    role: "CBSE Class 12 Student",
    review: "Uploading question papers and getting instant mock tests is incredibly helpful. It feels like having a personal tutor available 24/7.",
    rating: 4,
    initials: "S",
    color: "from-[#00D2FF] to-[#3D81E3]",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % EXAMPLES.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + EXAMPLES.length) % EXAMPLES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [goNext]);

  return (
    <LazyMotion features={domAnimation}>
    <section className="py-16 md:py-24 lg:py-28 relative overflow-hidden bg-gradient-to-b from-[#0C0C0C] to-[#0d0d15]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#3D81E3]/5 blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            What Students Say <span className="text-gradient">About FOURI</span>
          </h2>
          <p className="mt-3 text-xs text-[#555566] max-w-md mx-auto">
            Illustrative examples based on common student experiences.
          </p>
        </m.div>

        <div className="relative max-w-3xl mx-auto">
          <div className="min-h-[260px] flex items-center">
            <AnimatePresence mode="wait" custom={direction}>
              <m.div
                key={current}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="relative p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#3D81E3]/20 hover:shadow-lg hover:shadow-[#3D81E3]/5 transition-all duration-500">
                  <Quote className="absolute top-6 right-8 w-10 h-10 text-[#3D81E3]/20" />
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${EXAMPLES[current].color} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`}>
                      {EXAMPLES[current].initials}
                    </div>
                    <div>
                      <p className="font-semibold text-[#f5f5f7]">{EXAMPLES[current].role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < EXAMPLES[current].rating ? "text-amber-400 fill-amber-400" : "text-white/10"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-base text-[#888899] leading-relaxed italic">&ldquo;{EXAMPLES[current].review}&rdquo;</p>
                </div>
              </m.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={goPrev}
              className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] hover:border-white/[0.10] transition-all cursor-pointer"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4 text-[#888899]" />
            </button>
            <div className="flex gap-2">
              {EXAMPLES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current ? "bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] w-6" : "bg-white/10 hover:bg-white/20 w-2"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] hover:border-white/[0.10] transition-all cursor-pointer"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4 text-[#888899]" />
            </button>
          </div>
        </div>
      </div>
    </section>
    </LazyMotion>
  );
}
