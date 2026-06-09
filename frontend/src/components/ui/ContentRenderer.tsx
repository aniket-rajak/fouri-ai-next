"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { MathContent } from "./MathContent";
import { CodeBlock } from "./CodeBlock";
import { sanitizeSvg } from "../../lib/sanitizeSvg";

type Segment =
  | { type: "code"; language: string; content: string }
  | { type: "diagram"; content: string }
  | { type: "math"; content: string; display: boolean }
  | { type: "text"; content: string };

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function adaptSvgColors(svg: string, dark: boolean): string {
  if (!dark) return svg;

  let result = svg;

  const lightBgs = [
    { from: 'fill="white"', to: 'fill="#ffffff"' },
    { from: "fill='white'", to: "fill='#ffffff'" },
    { from: 'fill="#fff"', to: 'fill="#ffffff"' },
    { from: "fill='#fff'", to: "fill='#ffffff'" },
    { from: 'fill="#ffffff"', to: 'fill="#ffffff"' },
    { from: "fill='#ffffff'", to: "fill='#ffffff'" },
  ];
  for (const { from, to } of lightBgs) {
    result = result.split(from).join(to);
  }

  const darkStrokes: { from: string; to: string }[] = [
    { from: 'stroke="#000"', to: 'stroke="#1a1a2e"' },
    { from: "stroke='#000'", to: "stroke='#1a1a2e'" },
    { from: 'stroke="#333"', to: 'stroke="#1a1a2e"' },
    { from: "stroke='#333'", to: "stroke='#1a1a2e'" },
    { from: 'stroke="#222"', to: 'stroke="#1a1a2e"' },
    { from: "stroke='#222'", to: "stroke='#1a1a2e'" },
    { from: 'stroke="#111"', to: 'stroke="#1a1a2e"' },
    { from: "stroke='#111'", to: "stroke='#1a1a2e'" },
    { from: 'stroke="black"', to: 'stroke="#1a1a2e"' },
    { from: "stroke='black'", to: "stroke='#1a1a2e'" },
  ];
  for (const { from, to } of darkStrokes) {
    result = result.split(from).join(to);
  }

  const darkFills: { from: string; to: string }[] = [
    { from: 'fill="black"', to: 'fill="#1a1a2e"' },
    { from: "fill='black'", to: "fill='#1a1a2e'" },
    { from: 'fill="#000"', to: 'fill="#1a1a2e"' },
    { from: "fill='#000'", to: "fill='#1a1a2e'" },
  ];
  for (const { from, to } of darkFills) {
    result = result.split(from).join(to);
  }

  return result;
}

function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDarkMode());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setDark(isDarkMode());
    mediaQuery.addEventListener("change", handler);

    const observer = new MutationObserver(handler);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mediaQuery.removeEventListener("change", handler);
      observer.disconnect();
    };
  }, []);

  return dark;
}

function SvgRenderer({ svg }: { svg: string }) {
  const dark = useDarkMode();
  const sanitized = useMemo(() => sanitizeSvg(svg), [svg]);
  const adaptedSvg = useMemo(() => adaptSvgColors(sanitized, dark), [sanitized, dark]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!sanitized) return null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => setZoomLevel(1);

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-white group">
      <div className="px-3 py-1 bg-zinc-50 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          Diagram
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleZoomOut}
            className="text-xs px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 cursor-pointer"
            title="Zoom out"
          >
            −
          </button>
          <span className="text-[10px] text-zinc-400 min-w-[2rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="text-xs px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 cursor-pointer"
            title="Zoom in"
          >
            +
          </button>
          {zoomLevel !== 1 && (
            <button
              onClick={handleReset}
              className="text-[10px] px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 cursor-pointer"
              title="Reset zoom"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="overflow-auto p-3 flex items-start justify-center"
        style={{ maxHeight: "60vh", minHeight: "200px" }}
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease",
          }}
          dangerouslySetInnerHTML={{ __html: adaptedSvg }}
        />
      </div>
    </div>
  );
}

function parseContent(text: string): Segment[] {
  const segments: Segment[] = [];

  const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      segments.push(...parseMath(before));
    }
    const codeContent = match[2].trim();
    if (codeContent.startsWith("<svg") || codeContent.startsWith("<SVG")) {
      segments.push({ type: "diagram", content: match[2] });
    } else {
      segments.push({
        type: "code",
        language: match[1] || "",
        content: match[2],
      });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    segments.push(...parseMath(remaining));
  }

  return segments;
}

function extractSvgFromText(text: string): Segment[] {
  const segments: Segment[] = [];
  const svgRegex = /(<svg\b[^>]*>[\s\S]*?<\/svg>)/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = svgRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "diagram", content: match[1] });
    lastIndex = match.index + match[1].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

function parseMath(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }
    const raw = match[1];
    const display = raw.startsWith("$$");
    const content = raw.slice(display ? 2 : 1, raw.length - (display ? 2 : 1)).trim();
    segments.push({ type: "math", content, display });
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  // Post-process text segments to detect raw SVG outside code fences
  const finalSegments: Segment[] = [];
  for (const seg of segments) {
    if (seg.type === "text") {
      finalSegments.push(...extractSvgFromText(seg.content));
    } else {
      finalSegments.push(seg);
    }
  }

  return finalSegments;
}

interface ContentRendererProps {
  text: string;
}

export function ContentRenderer({ text }: ContentRendererProps) {
  const segments = parseContent(text);

  return (
    <span className="content-renderer">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "code":
            return <CodeBlock key={i} code={seg.content} language={seg.language} />;
          case "diagram":
            return <SvgRenderer key={i} svg={seg.content} />;
          case "math":
            return <MathContent key={i} text={seg.display ? `$$${seg.content}$$` : `$${seg.content}$`} />;
          case "text":
            return <span key={i} className="whitespace-pre-wrap break-words">{seg.content}</span>;
        }
      })}
    </span>
  );
}
