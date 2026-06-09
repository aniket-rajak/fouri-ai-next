"use client";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

function normalizeMathNotation(text: string): string {
  if (/\$/.test(text)) return text;

  const unicodeToLatex: Record<string, string> = {
    'π': '\\pi', 'θ': '\\theta', 'α': '\\alpha', 'β': '\\beta',
    'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\epsilon', 'ζ': '\\zeta',
    'η': '\\eta', 'ϕ': '\\phi', 'φ': '\\phi', 'χ': '\\chi',
    'ψ': '\\psi', 'ω': '\\omega', 'Ω': '\\Omega', 'Δ': '\\Delta',
    'Σ': '\\Sigma', 'σ': '\\sigma', 'μ': '\\mu', 'λ': '\\lambda',
    'τ': '\\tau', '∫': '\\int', '∑': '\\sum', '∏': '\\prod',
    '∞': '\\infty', '≠': '\\neq', '≤': '\\leq', '≥': '\\geq',
    '≈': '\\approx', '±': '\\pm', '×': '\\times', '÷': '\\div',
    '∩': '\\cap', '∪': '\\cup', '⊂': '\\subset', '⊃': '\\supset',
    '∈': '\\in', '∅': '\\emptyset', '∀': '\\forall', '∃': '\\exists',
    '→': '\\rightarrow', '←': '\\leftarrow', '↔': '\\leftrightarrow',
    '∂': '\\partial', '∇': '\\nabla', '·': '\\cdot', '∘': '\\circ',
    '∠': '\\angle', '⊥': '\\perp', '∥': '\\parallel',
    '∝': '\\propto', '∧': '\\wedge', '∨': '\\vee',
    '⊕': '\\oplus', '⊗': '\\otimes', '∴': '\\therefore',
    '∵': '\\because', '∼': '\\sim', '≅': '\\cong',
    '≡': '\\equiv', '≪': '\\ll', '≫': '\\gg',
    '²': '^2', '³': '^3', '¹': '^1',
  };

  const hasUnicodeMath = /[πθαβγδεζηϕφχψωΩΔΣσμλτ∏∫∑√∞≠≤≥≈±×÷∩∪⊂⊃∈∅∀∃→←↔∂∇⋅∘∠⊥∥°∝∧∨⊕⊗∴∵∼≅≡≪≫²³¹]/.test(text);
  const hasPowerOp = /[a-zA-Z0-9)\]}]?\^\{?\d+\}?/.test(text);
  const hasSubscript = /[A-Za-z]+_\d+/.test(text);
  const hasRawLatex = /\\(frac|sqrt|int|sum|prod|lim|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|sigma|mu|lambda|omega|delta|partial|infty|times|div|cdot|neq|leq|geq|approx|pm|rightarrow|forall|exists|subset|supset|cup|cap|in|emptyset|circ|perp|parallel|propto|wedge|vee|oplus|otimes)/.test(text);

  if (!hasUnicodeMath && !hasPowerOp && !hasSubscript && !hasRawLatex) return text;

  let result = text;
  for (const [unicode, latex] of Object.entries(unicodeToLatex)) {
    result = result.split(unicode).join(latex);
  }

  const longEnglishWords = result.split(/\s+/).filter(w => /^[a-zA-Z]{4,}$/.test(w));
  const isMathExpression = longEnglishWords.length === 0 || result.length < 50;

  if (isMathExpression) {
    return `$${result.trim()}$`;
  }

  return result;
}

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
  const normalized = normalizeMathNotation(text);
  const segments = parseLatexDelimiters(normalized);

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
