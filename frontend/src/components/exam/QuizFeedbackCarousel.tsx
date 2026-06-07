"use client";

import { useEffect, useState, useRef } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  subject: string;
  topic: string;
  difficulty: string;
  createdAt: string;
  reviewerName: string;
  reviewerAvatar: string | null;
}

export default function QuizFeedbackCarousel() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/quiz/feedback`)
      .then((r) => r.json())
      .then((data) => setFeedbacks(data.feedbacks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (loading || feedbacks.length === 0) return null;

  return (
    <LazyMotion features={domAnimation}>
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#f5f5f7]">
              What Students Say
            </h2>
            <p className="mt-3 text-sm text-[#888899] max-w-xl mx-auto">
              Real feedback from students who have used our AI quiz generator
            </p>
          </m.div>

          <div className="relative">
            {feedbacks.length > 3 && (
              <>
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-[#111118] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-all cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4 text-[#888899]" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-[#111118] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-all cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4 text-[#888899]" />
                </button>
              </>
            )}

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {feedbacks.map((fb, i) => (
                <m.div
                  key={fb.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="snap-start shrink-0 w-[280px] sm:w-[320px]"
                >
                  <div className="h-full p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.05] transition-all duration-300 flex flex-col">
                    <Quote className="w-5 h-5 text-[#3D81E3]/30 mb-3" />
                    <div className="flex items-center gap-0.5 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= fb.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-white/[0.06]"
                          }`}
                        />
                      ))}
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-[#c0c0c0] leading-relaxed mb-3 line-clamp-3 flex-1">
                        &ldquo;{fb.comment}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/[0.06]">
                      {fb.reviewerAvatar ? (
                        <img
                          src={fb.reviewerAvatar}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#3D81E3]/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-[#3D81E3]">
                            {fb.reviewerName === "Anonymous" ? "A" : fb.reviewerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs min-w-0">
                        <span className="text-[#c0c0c0] font-medium truncate">{fb.reviewerName}</span>
                        <span className="text-[#555566] shrink-0">&middot;</span>
                        <span className="text-[#3D81E3] shrink-0">{fb.subject}</span>
                      </div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
