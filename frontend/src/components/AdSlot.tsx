"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2512689434819222";

function getMinHeight(format: string): string {
  switch (format) {
    case "horizontal": return "min-h-[90px]";
    case "rectangle": return "min-h-[250px]";
    case "vertical": return "min-h-[250px]";
    default: return "min-h-[90px]";
  }
}

export function AdSlot({ slot, format = "auto", className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const adsbygoogle = (window as any).adsbygoogle || [];
            adsbygoogle.push({});
            rendered.current = true;
          } catch {
            // AdBlock or not loaded
          }
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`adsense-container ${getMinHeight(format)} flex items-center justify-center bg-zinc-50 rounded-lg overflow-hidden ${className}`}
      ref={containerRef}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
