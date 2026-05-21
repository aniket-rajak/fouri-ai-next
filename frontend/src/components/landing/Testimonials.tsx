"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Arjun Sharma",
    exam: "JEE Advanced 2026 Aspirant",
    avatar: "/assets/images/testimonials/avatar-1.jpg",
    review: "I uploaded my old JEE question papers and FOURI generated mock tests instantly. The AI explanations are incredibly helpful for understanding where I went wrong.",
    rating: 5,
  },
  {
    name: "Priya Das",
    exam: "NEET UG 2026 Aspirant",
    avatar: "/assets/images/testimonials/avatar-2.jpg",
    review: "This platform is a game-changer for NEET preparation. The OCR even read my handwritten biology notes! And it's completely free — I can't believe it.",
    rating: 5,
  },
  {
    name: "Rahul Banerjee",
    exam: "WBJEE 2026 Aspirant",
    avatar: "/assets/images/testimonials/avatar-3.jpg",
    review: "The chapter-wise analysis helped me identify my weak areas in Mathematics. I've improved my score by 30% in just 2 weeks of practice.",
    rating: 5,
  },
  {
    name: "Sneha Patel",
    exam: "CUET 2026 Aspirant",
    avatar: "/assets/images/testimonials/avatar-4.jpg",
    review: "I love how I can practice multiple subjects without switching platforms. The mock tests feel just like the real exam. Highly recommended!",
    rating: 5,
  },
  {
    name: "Amit Kumar",
    exam: "CBSE Class 12 Student",
    avatar: "/assets/images/testimonials/avatar-5.jpg",
    review: "My teachers recommended practicing with past papers. FOURI makes it so easy — just upload and start practicing. The performance insights are brilliant.",
    rating: 4,
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#0d0d15] to-[#08080f]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-300 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            What Students Say
            <br />
            <span className="text-gradient">About FOURI</span>
          </h2>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          <div className="min-h-[280px] flex items-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="relative glass rounded-3xl p-8 md:p-10 border border-white/5 shadow-xl shadow-blue-500/5">
                  <Quote className="absolute top-6 right-8 w-10 h-10 text-blue-500/20" />
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={testimonials[current].avatar}
                      alt={testimonials[current].name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/20"
                      loading="lazy"
                    />
                    <div>
                      <p className="font-semibold text-[#f5f5f7]">{testimonials[current].name}</p>
                      <p className="text-xs text-[#888899]">{testimonials[current].exam}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonials[current].rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-white/10"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-base text-[#888899] leading-relaxed italic">
                    &ldquo;{testimonials[current].review}&rdquo;
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-xl bg-[#111118] border border-white/5 flex items-center justify-center hover:bg-white/5 hover:border-blue-500/30 transition-colors cursor-pointer"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4 text-[#888899]" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current
                      ? "bg-blue-500 w-6"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              className="w-10 h-10 rounded-xl bg-[#111118] border border-white/5 flex items-center justify-center hover:bg-white/5 hover:border-blue-500/30 transition-colors cursor-pointer"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4 text-[#888899]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
