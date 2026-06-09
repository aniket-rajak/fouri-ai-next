"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
      <div className="px-4 py-1.5 bg-zinc-800/50 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className="p-4 text-[13px] sm:text-sm leading-relaxed text-zinc-100 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
