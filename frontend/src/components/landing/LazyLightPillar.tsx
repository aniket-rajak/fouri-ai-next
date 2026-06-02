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
  const [loaded, setLoaded] = useState(false);
  const [PillarComponent, setPillarComponent] =
    useState<React.ComponentType<LazyLightPillarProps> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded) {
          setLoaded(true);
          import("./LightPillar").then((mod) => {
            setPillarComponent(() => mod.default);
          });
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded]);

  return (
    <div ref={ref} className="absolute inset-0 z-[0]">
      {PillarComponent ? (
        <PillarComponent {...props} />
      ) : (
        <div className="absolute inset-0 bg-[#0C0C0C]" />
      )}
    </div>
  );
}
