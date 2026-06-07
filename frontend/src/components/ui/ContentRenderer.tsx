"use client";

import { MathContent } from "./MathContent";
import { CodeBlock } from "./CodeBlock";

type Segment =
  | { type: "code"; language: string; content: string }
  | { type: "math"; content: string; display: boolean }
  | { type: "text"; content: string };

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
    segments.push({
      type: "code",
      language: match[1] || "",
      content: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    segments.push(...parseMath(remaining));
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

  return segments;
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
          case "math":
            return <MathContent key={i} text={seg.display ? `$$${seg.content}$$` : `$${seg.content}$`} />;
          case "text":
            return <span key={i} className="whitespace-pre-wrap break-words">{seg.content}</span>;
        }
      })}
    </span>
  );
}
