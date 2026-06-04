"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const quotes = [
  "The secret of getting ahead is getting started.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going.",
  "The expert in anything was once a beginner.",
  "Your attitude determines your direction.",
  "Small daily improvements over time lead to stunning results.",
];

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 1500,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function GreetingSection({
  stats,
}: {
  stats: StatItem[];
}) {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [quote, setQuote] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    setQuote(quotes[0]);
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setQuoteIndex((i) => {
          const next = (i + 1) % quotes.length;
          setQuote(quotes[next]);
          return next;
        });
        setFading(false);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const name = user?.displayName || user?.email?.split("@")[0] || "Student";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50 to-sky-50 border border-zinc-200 p-6 sm:p-8">
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-200/40 rounded-full blur-3xl animate-orb" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-sky-200/40 rounded-full blur-3xl animate-orb" style={{ animationDelay: "-4s" }} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
              {greeting}, {name.split(" ")[0]}
            </h1>
            <p
              className={cn(
                "text-sm text-zinc-500 transition-opacity duration-400",
                fading ? "opacity-0" : "opacity-100"
              )}
            >
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/70 rounded-xl p-3 sm:p-4 text-center border border-zinc-100"
            >
              <p className="text-xl sm:text-2xl font-bold text-zinc-900">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix || ""}
                  suffix={stat.suffix || ""}
                />
              </p>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
