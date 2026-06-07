"use client";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
      {language && (
        <div className="px-4 py-1.5 bg-zinc-800/50 border-b border-zinc-800">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            {language}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <pre className="p-4 text-[13px] sm:text-sm leading-relaxed text-zinc-100 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
