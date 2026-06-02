"use client";

import { useEffect, useRef, useState } from "react";

interface BlogImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function BlogImage({ src, alt, className }: BlogImageProps) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef("");

  useEffect(() => {
    if (!src) return;

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) { setError(true); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setBlobUrl(url);
      } catch {
        setError(true);
      }
    })();

    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [src]);

  if (error) {
    return (
      <div className={`bg-[#111118] flex items-center justify-center ${className || ""}`}>
        <span className="text-4xl font-bold text-[#1a1a28]">F</span>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className={`bg-[#111118] animate-pulse ${className || ""}`} />
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      style={{ display: loaded ? undefined : "none" }}
    />
  );
}
