"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Clock, Play } from "lucide-react";

const mockTests = [
  {
    title: "JEE Physics Mock Test",
    subject: "Physics",
    difficulty: "Hard",
    questions: 45,
    time: "60 min",
    image: "/assets/images/hero/hero-4.jpg",
    slug: "/register",
  },
  {
    title: "NEET Biology Mock Test",
    subject: "Biology",
    difficulty: "Medium",
    questions: 90,
    time: "90 min",
    image: "/assets/images/showcase/showcase-1.jpg",
    slug: "/register",
  },
  {
    title: "WBJEE Math Mock Test",
    subject: "Mathematics",
    difficulty: "Medium",
    questions: 50,
    time: "60 min",
    image: "/assets/images/showcase/showcase-2.jpg",
    slug: "/register",
  },
  {
    title: "CUET English Mock Test",
    subject: "English",
    difficulty: "Easy",
    questions: 40,
    time: "45 min",
    image: "/assets/images/hero/hero-2.jpg",
    slug: "/register",
  },
  {
    title: "CBSE Class 12 Chemistry",
    subject: "Chemistry",
    difficulty: "Medium",
    questions: 35,
    time: "60 min",
    image: "/assets/images/showcase/showcase-3.jpg",
    slug: "/register",
  },
  {
    title: "UPSC History Practice",
    subject: "History",
    difficulty: "Hard",
    questions: 50,
    time: "60 min",
    image: "/assets/images/showcase/showcase-4.jpg",
    slug: "/register",
  },
];

const difficultyColor: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  Hard: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

export default function MockTestShowcase() {
  return (
    <section id="mock-tests" className="py-20 md:py-28 bg-[#0d0d15]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-300 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/10">
            Mock Tests
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            Practice with AI-Generated
            <br />
            <span className="text-gradient">Mock Tests</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTests.map((test, i) => (
            <motion.div
              key={test.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="group bg-[#111118] rounded-3xl overflow-hidden border border-white/5 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={test.image}
                  alt={test.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080f]/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${difficultyColor[test.difficulty]}`}>
                    {test.difficulty}
                  </span>
                </div>
                <div className="absolute top-3 right-3 bg-[#111118]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-300 border border-white/5">
                  {test.subject}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[#f5f5f7] group-hover:text-blue-300 transition-colors">
                  {test.title}
                </h3>
                <div className="mt-3 flex items-center gap-4 text-xs text-[#888899]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {test.questions} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {test.time}
                  </span>
                </div>
                <Link
                  href={test.slug}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 group/btn"
                >
                  Start Test
                  <Play className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
