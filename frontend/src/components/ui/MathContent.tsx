"use client";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface Segment {
  type: "text" | "math";
  content: string;
  display: boolean;
}

function parseLatexDelimiters(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index), display: false });
    }

    const raw = match[1];
    const display = raw.startsWith("$$");
    const content = raw.slice(display ? 2 : 1, raw.length - (display ? 2 : 1)).trim();
    segments.push({ type: "math", content, display });
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex), display: false });
  }

  return segments;
}

interface MathContentProps {
  text: string;
}

export function MathContent({ text }: MathContentProps) {
  const segments = parseLatexDelimiters(text);

  return (
    <span className="math-content">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.content}</span>;
        }
        try {
          return seg.display ? (
            <BlockMath key={i} math={seg.content} />
          ) : (
            <InlineMath key={i} math={seg.content} />
          );
        } catch {
          return <span key={i}>{seg.content}</span>;
        }
      })}
    </span>
  );
}
