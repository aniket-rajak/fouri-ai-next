"use client";

import { useState } from "react";
import { getFileUrl } from "@/lib/getFileUrl";

interface BlogImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function BlogImage({ src, alt, className }: BlogImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedSrc = getFileUrl(src);

  if (error) {
    return (
      <div className={`bg-zinc-100 flex items-center justify-center ${className || ""}`}>
        <span className="text-4xl font-bold text-zinc-300">F</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {!loaded && (
        <div className={`absolute inset-0 bg-zinc-200 animate-pulse rounded-inherit ${className || ""}`} />
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        className={className}
        crossOrigin="anonymous"
        onLoad={() => setLoaded(true)}
        onError={() => {
          console.error("[BlogImage] Failed to load image:", resolvedSrc);
          setError(true);
        }}
      />
    </div>
  );
}
