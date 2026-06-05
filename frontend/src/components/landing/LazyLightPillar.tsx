"use client";

import { useRef, useEffect, useState } from "react";

interface LazyLightPillarProps {
  topColor?: string;
  bottomColor?: string;
  intensity?: number;
  rotationSpeed?: number;
  interactive?: boolean;
  className?: string;
  glowAmount?: number;
  pillarWidth?: number;
  pillarHeight?: number;
  noiseIntensity?: number;
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
  pillarRotation?: number;
  quality?: "low" | "medium" | "high";
}

export function LazyLightPillar(props: LazyLightPillarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [PillarComponent, setPillarComponent] =
    useState<React.ComponentType<LazyLightPillarProps> | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 768px)").matches);
  }, []);

  useEffect(() => {
    if (isMobile !== false) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const doLoad = () => {
            import("./LightPillar").then((mod) => {
              setPillarComponent(() => mod.default);
            });
          };
          if ("requestIdleCallback" in window) {
            requestIdleCallback(doLoad, { timeout: 2000 });
          } else {
            doLoad();
          }
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

  if (isMobile === true) {
    return (
      <div className="absolute inset-0 z-[0]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3D81E3]/10 via-transparent to-[#00D2FF]/5" />
      </div>
    );
  }

  return (
    <div ref={ref} className="absolute inset-0 z-[0]">
      {PillarComponent ? (
        <PillarComponent {...props} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#3D81E3]/10 via-transparent to-[#00D2FF]/5" />
      )}
    </div>
  );
}
