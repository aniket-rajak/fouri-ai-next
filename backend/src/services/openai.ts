import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.groq.apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  type: "MCQ" | "SUBJECTIVE";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic?: string;
  subject?: string;
}

const SYSTEM_PROMPT = `IMPORTANT: Extract ALL questions. Do NOT stop at a fixed number. Continue extracting until you have processed the ENTIRE text. There is no limit. Extract every single question you find.

You are an OCR text analyzer. Given OCR text from a question paper, extract ALL questions exactly as they appear.

CRITICAL RULES:
- Extract EVERY question present in the text. Do not skip any. Do not limit to a fixed number.
- Return ONLY a valid JSON object with a "questions" array. No markdown, no explanation.
- For each question, set "subject" to the exam subject name mentioned in the paper header (e.g., "Mathematics", "English", "Physics"). If no subject is found, set it to "General".
- Copy the question text EXACTLY as it appears. Do NOT rephrase, summarize, or modify.
- For MCQs: extract the EXACT options as they appear. Do not add or change options.
- For subjective questions: options=[] and type="SUBJECTIVE". Set correctAnswer to the expected answer if provided in the text or answer key. If no answer is provided in the paper, set correctAnswer to an empty string.
- For subjective questions that are short-answer or have an answer key present in the text, extract the correctAnswer. Copy it EXACTLY as it appears.
- If a subjective question does NOT have an answer provided in the paper, set correctAnswer to "" (empty string).
- Do NOT hallucinate answers or generate options that aren't in the text.
- Assign difficulty based on the question type: "EASY" for basic recall, "MEDIUM" for application, "HARD" for complex problems.
- Fix only obvious OCR spacing/encoding artifacts (e.g., merged words).

MATHEMATICAL NOTATION RECONSTRUCTION — CRITICAL:
The OCR text often contains garbled mathematical expressions. You MUST identify
these and reconstruct them into proper LaTeX using $...$ delimiters.

Context clues that indicate math: presence of "Solve", "Find", "Evaluate",
"Show that", "Prove", "Calculate", "If", "Then", numbers with operators like
"=", "+", "-", "x" (multiplication), variables (x, y, z), parenthesized
expressions, numbers adjacent to variables, or any of the patterns below.

Reconstruct these common OCR errors:

SUPERSCRIPTS (exponents, powers):
  "x 2" or "x2" (with space or no space) → "$x^2$"
  "x 3" → "$x^3$"
  "x n" → "$x^n$"
  "x (n+1)" → "$x^{n+1}$"
  "x 2 + y 2 = r 2" → "$x^2 + y^2 = r^2$"
  "e x" → "$e^{x}$"
  "2 x" (in exponent context) → "$2^x$"

SUBSCRIPTS:
  "H 2 O" or "H2O" → "$H_2O$"
  "x 1" (when clearly a variable index) → "$x_1$"
  "a n" → "$a_n$"

FRACTIONS:
  "1/2" or "1 / 2" → "$\\frac{1}{2}$"
  "a/b" → "$\\frac{a}{b}$"
  "(a + b)/c" → "$\\frac{a + b}{c}$"
  "x/y" → "$\\frac{x}{y}$"

SQUARE ROOTS AND ROOTS:
  "sqrt(x)" or "sq root(x)" or "square root of x" → "$\\sqrt{x}$"
  "Vx" (capital V used as root symbol) → "$\\sqrt{x}$"
  "cube root of x" → "$\\sqrt[3]{x}$"

INTEGRALS:
  "integral f(x) dx" → "$\\int f(x) dx$"
  "integral from a to b f(x) dx" → "$\\int_{a}^{b} f(x) dx$"
  "S" or "I" used as integral symbol → "$\\int$"

SUMS AND PRODUCTS:
  "sum i=1 to n" → "$\\sum_{i=1}^{n}$"
  "product i=1 to n" → "$\\prod_{i=1}^{n}$"
  "E" used as summation symbol → "$\\sum$"

OPERATORS:
  "=" (keep as is) → "="
  "=!" or "= /" or "not =" → "$\\neq$"
  "+ -" or "+-" → "$\\pm$"
  "x" (between numbers, as multiply) → "$\\times$"
  "/" (as divide between expressions) → "$\\div$"
  "<=" → "$\\leq$"
  ">=" → "$\\geq$"
  "- >" or "arrow" → "$\\to$" or "$\\rightarrow$"

GREEK LETTERS:
  "pi" → "$\\pi$"
  "theta" → "$\\theta$"
  "alpha" → "$\\alpha$"
  "beta" → "$\\beta$"
  "sigma" → "$\\sigma$"
  "delta" → "$\\delta$"
  "gamma" → "$\\gamma$"
  "mu" → "$\\mu$"
  "lambda" → "$\\lambda$"
  "omega" → "$\\omega$"

OTHER MATH SYMBOLS:
  "oo" or "infinity" or "inf" → "$\\infty$"
  "|x|" → "$|x|$"
  "in" or "element of" → "$\\in$"
  "subset" → "$\\subset$"
  "union" → "$\\cup$"
  "intersection" → "$\\cap$"
  "empty set" → "$\\emptyset$"
  "dot" or "cdot" → "$\\cdot$"
  "V" as "for all" → "$\\forall$"
  "there exists" → "$\\exists$"

FUNCTIONS:
  "sin x" → "$\\sin x$"
  "cos x" → "$\\cos x$"
  "tan x" → "$\\tan x$"
  "log x" → "$\\log x$"
  "ln x" → "$\\ln x$"
  "lim" → "$\\lim$"
  "f(x)" → "$f(x)$"

IMPORTANT RULES:
1. Wrap every reconstructed math expression in $...$ or $$...$$
2. Use $ for inline math, $$ for display math (centered equations like integrals, sums)
3. If a text contains both math and words, use inline $...$ for just the math parts
4. For multi-character superscripts use curly braces: $x^{12}$, $e^{2x}$
5. Preserve equation structure: if the OCR has "x = (-b +- sqrt(b 2 - 4ac))/2a",
   reconstruct as "$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"
6. When in doubt between two interpretations of a number/variable spacing,
   prefer the mathematically meaningful interpretation
7. Pay attention to context: if a word like "Solve" or "Find the value of"
   precedes garbled text, it is almost certainly a mathematical expression
8. For answer options that look numeric or algebraic, wrap them in $...$
9. Do NOT wrap plain English text in $...$ — only wrap mathematical expressions

BENGALI (বাংলা) AND HINDI (हिन्दी) TEXT CORRECTION:
The OCR text may contain errors in Bengali and Hindi characters. Correct these based on context:

Common Bengali OCR errors (fix when context makes it clear):
  - ত↔দ (to↔do): These look similar in many fonts
  - ভ↔ব (bho↔bo): Frequently confused
  - ন↔ণ (no↔no): Different n sounds, often swapped
  - স↔শ (so↔sho): Common confusion
  - ষ↔স (sho↔so): Another sibilant confusion
  - র↔য (ro↔yo): Similar shapes

Common Hindi/Devanagari OCR errors (fix when context makes it clear):
  - ि (combining)↔ि (separate): Vowel sign i often detaches from consonant
  - ी↔◌ी (long i): Length distinction may be lost
  - ो↔◌ो (long o): Similar shape confusion
  - ौ↔◌ौ (au): Often misrecognized
  - त↔त्र (ta↔tra): Conjunct vs simple consonant

Preserve the correct script (Bengali/Hindi/English) for each question. Do NOT transliterate Bengali or Hindi text to English. Keep each question in its original script.

Output format:
{
  "questions": [
    {
      "question": "What is Newton's second law?",
      "options": ["F=ma", "F=mv", "F=md", "F=m/a"],
      "correctAnswer": "F=ma",
      "type": "MCQ",
      "difficulty": "EASY",
      "topic": "Newton's Laws",
      "subject": "Physics"
    }
  ]
}`;

function normalizeType(type: string): "MCQ" | "SUBJECTIVE" {
  const t = (type || "").toUpperCase().trim();
  if (["MCQ", "MULTIPLE CHOICE", "MULTIPLE_CHOICE", "OBJECTIVE", "CHOOSE", "SELECT"].includes(t)) return "MCQ";
  if (["SUBJECTIVE", "DESCRIPTIVE", "ESSAY", "WRITTEN", "THEORY", "LONG ANSWER", "SHORT ANSWER"].includes(t)) return "SUBJECTIVE";
  return "MCQ";
}

function normalizeDifficulty(difficulty: string): "EASY" | "MEDIUM" | "HARD" {
  const d = (difficulty || "").toUpperCase().trim();
  if (["EASY", "BEGINNER", "BASIC", "SIMPLE"].includes(d)) return "EASY";
  if (["HARD", "DIFFICULT", "COMPLEX", "ADVANCED", "TOUGH"].includes(d)) return "HARD";
  return "MEDIUM";
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const MAX_CHUNK_CHARS = 1200;
const CHUNK_OUTPUT_TOKENS = 2000;
const MAX_REQUEST_TOKENS = 5500;
const OVERLAP_LINES = 5;

function chunkText(text: string): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let start = 0;

  while (start < lines.length) {
    let end = start;
    let charCount = 0;

    while (end < lines.length && charCount < MAX_CHUNK_CHARS) {
      charCount += lines[end].length + 1;
      end++;
    }

    if (end < lines.length && end - start > 10) {
      let boundary = end;
      while (boundary > start) {
        const line = lines[boundary].trim();
        if (line === "" || /^\d+[.)]/.test(line)) {
          break;
        }
        boundary--;
      }
      if (boundary > start && end - boundary < 15) {
        end = boundary;
      }
    }

    const overlapStart = Math.max(0, start - OVERLAP_LINES);
    const chunk = lines.slice(overlapStart, end).join("\n");
    chunks.push(chunk);
    start = end;
  }

  return chunks;
}

function normalizeQuestion(q: Record<string, unknown>): ParsedQuestion {
  let options: string[] = [];
  if (Array.isArray(q.options)) options = q.options as string[];
  else if (typeof q.options === "string") {
    try { options = JSON.parse(q.options as string); }
    catch { options = []; }
  }
  return {
    question: q.question as string || "",
    options,
    correctAnswer: (q.correctAnswer as string) || "",
    type: normalizeType(q.type as string),
    difficulty: normalizeDifficulty(q.difficulty as string),
    topic: q.topic as string | undefined,
    subject: q.subject as string | undefined,
  };
}

const CHUNK_RETRY_FALLBACK_PROMPT = `Extract questions from the text below. Return ONLY a valid JSON object with a "questions" array. Each question must have: question, options (array of strings, empty for subjective), correctAnswer (string), type ("MCQ" or "SUBJECTIVE"), difficulty ("EASY", "MEDIUM", or "HARD"). No markdown, no explanation, no code fences.`;

async function analyzeChunk(text: string): Promise<ParsedQuestion[]> {
  const attempt = async (prompt: string, model: string, signal?: AbortSignal) => {
    const estimatedPromptTokens = Math.ceil((prompt.length + text.length) / 2);
    const maxTokens = Math.min(
      CHUNK_OUTPUT_TOKENS,
      Math.max(1500, MAX_REQUEST_TOKENS - estimatedPromptTokens)
    );
    if (maxTokens < CHUNK_OUTPUT_TOKENS) {
      console.log(`[openai] Reducing max_tokens to ${maxTokens} (estimated ${estimatedPromptTokens} prompt tokens, limit ${MAX_REQUEST_TOKENS})`);
    }

    const response = await callWithRetry(
      (s) =>
        client.chat.completions.create(
          {
            model,
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: text },
            ],
            temperature: 0.1,
            max_tokens: maxTokens,
            response_format: { type: "json_object" },
          },
          s ? { signal: s } : undefined
        ),
      signal
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");
    return content;
  };

  const parseQuestions = (raw: string): ParsedQuestion[] => {
    const cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          const arrMatch = cleaned.match(/"questions"\s*:\s*\[[\s\S]*?\]\s*}/);
          if (arrMatch) {
            try {
              parsed = JSON.parse(`{${arrMatch[0]}}`);
            } catch {
              throw new Error("Failed to parse OpenAI response as JSON after all fallback attempts");
            }
          } else {
            throw new Error("Failed to parse OpenAI response as JSON after all fallback attempts");
          }
        }
      } else {
        throw new Error("Failed to parse OpenAI response as JSON after all fallback attempts");
      }
    }

    const questions = (parsed.questions || parsed) as Record<string, unknown>[];
    if (!Array.isArray(questions)) {
      throw new Error("Invalid response format from OpenAI");
    }
    return questions.map(normalizeQuestion);
  };

  const attemptWithModel = async (prompt: string, model: string, signal?: AbortSignal): Promise<ParsedQuestion[]> => {
    const raw = await attempt(prompt, model, signal);
    try {
      return parseQuestions(raw);
    } catch (err) {
      console.error(`[openai] ${model} parse failed. Raw (first 500): ${raw.slice(0, 500)}`);
      console.log(`[openai] Retrying ${model} with simplified fallback prompt...`);
      const fallbackRaw = await attempt(CHUNK_RETRY_FALLBACK_PROMPT, model, signal);
      return parseQuestions(fallbackRaw);
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600_000);

  try {
    try {
      return await attemptWithModel(SYSTEM_PROMPT, "llama-3.1-8b-instant", controller.signal);
    } catch (err: any) {
      if (err?.status === 400 || err?.message?.includes("Failed to generate JSON")) {
        console.log(`[openai] 8B model failed (400), falling back to 70B...`);
        return await attemptWithModel(SYSTEM_PROMPT, "llama-3.3-70b-versatile", controller.signal);
      }
      throw err;
    }
  } finally {
    clearTimeout(timeout);
  }
}

const CHUNK_DELAY_MS = 20000;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function dedupQuestions(questions: ParsedQuestion[]): ParsedQuestion[] {
  const result: ParsedQuestion[] = [];
  for (const q of questions) {
    const isDuplicate = result.some((existing) => {
      const a = existing.question.replace(/\s+/g, " ").trim().toLowerCase();
      const b = q.question.replace(/\s+/g, " ").trim().toLowerCase();
      if (a === b) return true;
      if (a.length > 20 && b.length > 20) {
        if (a.includes(b) || b.includes(a)) return true;
      }
      return false;
    });
    if (!isDuplicate) {
      result.push(q);
    }
  }
  return result;
}

export async function analyzeQuestions(
  text: string
): Promise<ParsedQuestion[]> {
  const chunks = chunkText(text);

  if (chunks.length <= 1) {
    return shuffleArray(await analyzeChunk(chunks[0] || text));
  }

  console.log(`[Analyze] Splitting into ${chunks.length} chunks for AI processing`);

  const totalEstimate = Math.ceil(chunks.length * CHUNK_DELAY_MS / 60000);
  console.log(`[Analyze] Estimated total time: ~${totalEstimate} minutes (${CHUNK_DELAY_MS / 1000}s delay between chunks)`);

  const allQuestions: ParsedQuestion[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      console.log(`[Analyze] Waiting ${CHUNK_DELAY_MS / 1000}s to respect Groq free TPM limit...`);
      await delay(CHUNK_DELAY_MS);
    }
    console.log(`[Analyze] Processing chunk ${i + 1}/${chunks.length}...`);
    const questions = await analyzeChunk(chunks[i]);
    allQuestions.push(...questions);
  }

  const deduped = dedupQuestions(allQuestions);
  const removed = allQuestions.length - deduped.length;
  if (removed > 0) {
    console.log(`[Analyze] Removed ${removed} duplicate question(s) from chunk overlap`);
  }

  return shuffleArray(deduped);
}

export async function generateExplanation(
  question: string,
  correctAnswer: string,
  type: "short" | "detailed"
): Promise<string> {
  const prompt =
    type === "short"
      ? `Explain this answer briefly (2-3 sentences) in simple terms.\nQuestion: ${question}\nAnswer: ${correctAnswer}`
      : `Provide a detailed step-by-step explanation for this answer. Use simple language. Include the concept and reasoning.\nQuestion: ${question}\nAnswer: ${correctAnswer}`;

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: type === "short" ? 200 : 800,
  });

  return response.choices[0]?.message?.content || "";
}

export async function generateEmailContent(
  instructions: string,
  tone: string
): Promise<{ subject: string; body: string; ctaText: string }> {
  const prompt = `You are an expert email copywriter for a SaaS platform called FOURI. Write a professional, modern HTML email based on these instructions.

Instructions: "${instructions}"
Tone: ${tone}

Respond with valid JSON only — no markdown, no code fences:
{
  "subject": "Compelling subject line (max 10 words)",
  "body": "Full HTML email body (see formatting requirements below)",
  "ctaText": "Call-to-action button text (max 5 words)"
}

FORMATTING REQUIREMENTS FOR body:
- Use inline CSS on every element (email-client safe)
- DO NOT include <html>, <head>, <body>, or <!DOCTYPE> — only the inner content
- Main heading: <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 16px 0; line-height: 1.3;">
- Subheadings: <h2 style="font-size: 18px; font-weight: 600; color: #2d2d44; margin: 24px 0 12px 0; line-height: 1.4;">
- Paragraphs: <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #444444;">
- Bullet lists: <ul style="margin: 0 0 16px 0; padding: 0 0 0 20px; list-style: disc;"> with <li style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.5; color: #444444;">
- Numbered lists: <ol style="margin: 0 0 16px 0; padding: 0 0 0 20px;"> with <li style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.5; color: #444444;">
- CTA button — use a table-based button for email compatibility with {{appUrl}} as the link:
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
    <tr>
      <td align="center" style="background-color: #2563eb; border-radius: 6px; padding: 12px 32px;">
        <a href="{{appUrl}}" style="color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">{{CTA_TEXT}}</a>
      </td>
    </tr>
  </table>
- Divider: <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
- Small/footer text: <p style="margin: 0; font-size: 13px; color: #888899; line-height: 1.5;">
- Wrap everything in a single <div style="max-width: 560px; margin: 0 auto;">
- Separate sections with margin-top: 24px
- Use proper paragraph spacing — never put two <p> tags directly adjacent without margin
- Keep total body under 500 words
- Match the requested tone exactly
- Structure the email with:
  1. A strong introduction with a bold heading
  2. 1-3 content sections with subheadings
  3. A CTA section with the button
  4. A brief closing/footer line`;

  let parsed: Record<string, string>;
  try {
    const response = await callWithRetry(
      (s) =>
        client.chat.completions.create(
          {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          },
          s ? { signal: s } : undefined
        ),
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI during email generation");

    const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[openai] Failed to parse email content JSON. Raw response (first 500 chars):", cleaned.slice(0, 500));
      throw new Error("Failed to parse AI generated email content as JSON");
    }
  } catch (error: any) {
    console.error("[openai] Email generation failed:", error?.message || error);
    if (error?.status) console.error("[openai] HTTP status:", error.status);
    if (error?.code) console.error("[openai] Error code:", error.code);
    if (error?.stack) console.error("[openai] Stack:", error.stack);
    throw error;
  }

  return {
    subject: parsed.subject || "",
    body: parsed.body || "",
    ctaText: parsed.ctaText || "",
  };
}

export interface MCQExplanation {
  shortExplanation: string;
  detailedExplanation: string;
}

export interface SubjectiveEvaluation {
  modelAnswer: string;
  feedback: string;
  isCorrect: boolean | null;
}

async function callWithRetry<T>(fn: (signal?: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn(signal);
    } catch (error: any) {
      lastError = error;
      if (error?.name === "AbortError") throw error;
      const isRetryable =
        error?.status === 429 ||
        error?.status === 400 ||
        error?.code === "rate_limit" ||
        error?.message?.includes("429") ||
        error?.message?.includes("rate limit") ||
        (error?.status >= 500 && error?.status < 600);
      if (!isRetryable || attempt === 3) throw error;
      const delayMs = 2000 * attempt;
      console.warn(`[openai] Transient error (${error?.status || "unknown"}) on attempt ${attempt}/3. Retrying in ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

export interface GeneratedBlog {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: string;
}

export async function generateBlogContent(
  instructions: string
): Promise<GeneratedBlog> {
  const prompt = `You are an expert blog writer for a SaaS platform called FOURI.IN — an AI-powered mock test platform for students preparing for competitive exams like JEE, NEET, WBJEE, and CUET.

Instructions: "${instructions}"

Respond with valid JSON only — no markdown, no code fences:
{
  "title": "SEO-friendly blog title (max 12 words)",
  "excerpt": "Compelling 2-3 sentence summary (max 50 words)",
  "content": "Full HTML blog post content (see formatting rules below)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "One of: Study Tips, Exam Preparation, Technology, Education, Product Updates"
}

FORMATTING RULES FOR content:
- Use inline CSS on all elements
- Main heading: <h1 style="font-size: 28px; font-weight: 700; color: #f5f5f7; margin: 0 0 20px 0;">
- Subheadings: <h2 style="font-size: 22px; font-weight: 600; color: #f5f5f7; margin: 32px 0 16px 0;">
- Sub-subheadings: <h3 style="font-size: 18px; font-weight: 600; color: #e0e0e0; margin: 24px 0 12px 0;">
- Paragraphs: <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.8; color: #c0c0c0;">
- Strong/emphasis: <strong> or <em> inside <p> tags
- Bullet lists: <ul style="margin: 0 0 16px 0; padding-left: 24px;"> with <li style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.6; color: #c0c0c0;">
- Numbered lists: <ol style="margin: 0 0 16px 0; padding-left: 24px;">
- Blockquotes: <blockquote style="border-left: 3px solid #3D81E3; margin: 24px 0; padding: 16px 24px; background: rgba(61,129,227,0.05); border-radius: 0 8px 8px 0;">
- Code inline: <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 4px; font-size: 14px;">
- Links: <a href="#" style="color: #3D81E3; text-decoration: underline;">
- Do NOT include <html>, <head>, <body>, or <!DOCTYPE>
- Wrap everything in <article style="max-width: 800px; margin: 0 auto;">
- Keep total under 1500 words
- Make it engaging, educational, and valuable for students
- Include practical tips and actionable advice`;

  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during blog generation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[openai] Failed to parse blog content JSON. Raw response (first 500 chars):", cleaned.slice(0, 500));
    throw new Error("Failed to parse AI generated blog content as JSON");
  }

  return {
    title: parsed.title || "",
    excerpt: parsed.excerpt || "",
    content: parsed.content || "",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    category: parsed.category || "Education",
  };
}

export interface GeneratedAd {
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

export async function generateAdContent(
  instructions: string
): Promise<GeneratedAd> {
  const prompt = `You are an expert ad copywriter for FOURI.IN — an AI-powered mock test platform for students preparing for competitive exams like JEE, NEET, WBJEE, and CUET.

Instructions: "${instructions}"

Respond with valid JSON only — no markdown, no code fences:
{
  "title": "Compelling ad headline (max 8 words)",
  "description": "Persuasive 1-2 sentence description (max 30 words)",
  "ctaText": "Short call-to-action button text (max 4 words)",
  "ctaLink": "https://fouri.in"
}

Rules:
- Title must be attention-grabbing and relevant to exam preparation
- Description should highlight value and create urgency
- ctaText should be action-oriented (e.g., "Start Free Trial", "Take Mock Test", "Download Now")
- Keep tone motivational and student-focused
- Make it specific to the given instructions`;

  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during ad generation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[openai] Failed to parse ad content JSON. Raw response (first 500 chars):", cleaned.slice(0, 500));
    throw new Error("Failed to parse AI generated ad content as JSON");
  }

  return {
    title: parsed.title || "",
    description: parsed.description || "",
    ctaText: parsed.ctaText || "Learn More",
    ctaLink: parsed.ctaLink || "https://fouri.in",
  };
}

export async function evaluateSubjectiveWithAI(
  questionText: string,
  userAnswer: string | null | undefined
): Promise<SubjectiveEvaluation> {
  const answerText = userAnswer?.trim() || "(No answer provided)";

  const prompt = `You are an exam evaluator. Evaluate the student's answer to a subjective question.

Question: "${questionText}"

Student's answer: "${answerText}"

First, determine what the correct/expected answer should be. Then evaluate the student's answer.

Respond with valid JSON only — no markdown, no code fences:
{
  "modelAnswer": "The complete correct/expected answer",
  "isCorrect": true,
  "feedback": "Brief feedback explaining why (2-3 sentences)"
}

Rules:
- isCorrect: true if fully correct, false if wrong, null if partially correct
- For partial credit (null): the student has some understanding but missed key points or made errors
- Be generous: if the student's answer captures the core concept, mark as correct (true)
- modelAnswer should be thorough and accurate
- feedback must be helpful and educational, not just "correct" or "wrong"
- If the student didn't answer, mark as false with appropriate feedback`;

  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during subjective evaluation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[openai] Failed to parse subjective evaluation JSON. Raw response (first 500 chars):", cleaned.slice(0, 500));
    throw new Error("Failed to parse AI subjective evaluation as JSON");
  }

  return {
    modelAnswer: parsed.modelAnswer || "",
    feedback: parsed.feedback || "",
    isCorrect: parsed.isCorrect === undefined ? null : parsed.isCorrect,
  };
}

export async function generateExplanationForMCQ(
  questionText: string,
  options: string[],
  correctAnswer: string,
  userAnswer: string | null | undefined
): Promise<MCQExplanation> {
  const userChoice = userAnswer?.trim() || "(Not answered)";

  const prompt = `You are a tutor explaining a multiple-choice question to a student.

Question: "${questionText}"

Options:
${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}

Correct answer: "${correctAnswer}"
Student's chosen answer: "${userChoice}"

Explain why the correct answer is correct. If the student chose a wrong answer, explain why that answer is incorrect and what misconception it might reflect.

Respond with valid JSON only — no markdown, no code fences:
{
  "shortExplanation": "A concise 2-3 sentence explanation of the key concept",
  "detailedExplanation": "A thorough, educational explanation covering why the correct answer is right and (if applicable) why the wrong answer is wrong"
}`;

  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during MCQ explanation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[openai] Failed to parse MCQ explanation JSON. Raw response (first 500 chars):", cleaned.slice(0, 500));
    throw new Error("Failed to parse AI MCQ explanation as JSON");
  }

  return {
    shortExplanation: parsed.shortExplanation || "",
    detailedExplanation: parsed.detailedExplanation || "",
  };
}

export interface AnalysisInput {
  questions: {
    id: string;
    questionText: string;
    type: string;
    difficulty: string;
    topic?: string | null;
    correctAnswer: string;
  }[];
  userAnswers?: {
    questionId: string;
    selectedOption: string | null;
    isCorrect: boolean | null;
    timeSpent?: number | null;
  }[];
  communityStats?: {
    avgScore: number | null;
    totalStudents: number;
    mostIncorrectQuestions?: { questionId: string; failureRate: number }[];
  };
}

export interface AnalysisReport {
  overallSummary: string;
  strengths: { topic: string; accuracy: number; comment: string }[];
  weaknesses: { topic: string; accuracy: number; comment: string }[];
  recommendations: string[];
  studyStrategy: string;
  difficultyBreakdown: {
    easy: { correct: number; total: number; accuracy: number };
    medium: { correct: number; total: number; accuracy: number };
    hard: { correct: number; total: number; accuracy: number };
  };
  questionInsights: { questionId: string; insight: string }[];
}

export async function generateAnalysisReport(input: AnalysisInput): Promise<AnalysisReport> {
  const prompt = buildAnalysisPrompt(input);

  const response = await Promise.race([
    client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an AI test performance analyst. Analyze the student's test performance and provide a structured report.
Return ONLY valid JSON with no markdown formatting. The JSON must match the specified schema exactly.

Schema:
{
  "overallSummary": "string - 2-3 sentence summary of overall performance",
  "strengths": [{ "topic": "string", "accuracy": number, "comment": "string - why this is a strength" }],
  "weaknesses": [{ "topic": "string", "accuracy": number, "comment": "string - specific areas to improve" }],
  "recommendations": ["string - actionable study recommendation"],
  "studyStrategy": "string - 2-3 sentence personalized study strategy",
  "difficultyBreakdown": {
    "easy": { "correct": number, "total": number, "accuracy": number },
    "medium": { "correct": number, "total": number, "accuracy": number },
    "hard": { "correct": number, "total": number, "accuracy": number }
  },
  "questionInsights": [{ "questionId": "string", "insight": "string - specific insight about this question" }]
}

Accuracy is a percentage 0-100. If no user answers provided, set strengths/weaknesses to empty arrays and difficultyBreakdown accuracies to 0.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Analysis generation timeout")), 180000)
    ),
  ]);

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI during analysis generation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      overallSummary: parsed.overallSummary || "Analysis completed.",
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      recommendations: parsed.recommendations || [],
      studyStrategy: parsed.studyStrategy || "Continue practicing regularly.",
      difficultyBreakdown: parsed.difficultyBreakdown || { easy: { correct: 0, total: 0, accuracy: 0 }, medium: { correct: 0, total: 0, accuracy: 0 }, hard: { correct: 0, total: 0, accuracy: 0 } },
      questionInsights: parsed.questionInsights || [],
    };
  } catch {
    console.error("[openai] Failed to parse analysis report JSON. Raw response (first 500 chars):", cleaned.slice(0, 500));
    throw new Error("Failed to parse AI analysis response");
  }
}

function buildAnalysisPrompt(input: AnalysisInput): string {
  const sections: string[] = [];

  sections.push("TEST QUESTIONS:");
  input.questions.forEach((q, i) => {
    sections.push(`[Q${i + 1}] id:${q.id} | ${q.questionText.substring(0, 200)} | Type:${q.type} | Difficulty:${q.difficulty} | Topic:${q.topic || "N/A"} | CorrectAnswer:${q.correctAnswer.substring(0, 100)}`);
  });

  if (input.userAnswers && input.userAnswers.length > 0) {
    sections.push("\nUSER ANSWERS:");
    input.userAnswers.forEach((a, i) => {
      const q = input.questions.find((q) => q.id === a.questionId);
      sections.push(`[Q${i + 1}] id:${a.questionId} | Selected:${a.selectedOption || "(empty)"} | Correct:${a.isCorrect !== null ? (a.isCorrect ? "Yes" : "No") : "Unevaluated"} | Time:${a.timeSpent || "N/A"}s`);
    });

    const correct = input.userAnswers.filter((a) => a.isCorrect === true).length;
    const wrong = input.userAnswers.filter((a) => a.isCorrect === false).length;
    const total = input.userAnswers.length;
    sections.push(`\nSUMMARY: ${correct}/${total} correct (${total > 0 ? Math.round((correct / total) * 100) : 0}%), ${wrong} wrong, ${total - correct - wrong} unevaluated`);
  }

  if (input.communityStats) {
    sections.push("\nCOMMUNITY STATS:");
    sections.push(`Avg Score: ${input.communityStats.avgScore ?? "N/A"}%`);
    sections.push(`Total Students: ${input.communityStats.totalStudents}`);
    if (input.communityStats.mostIncorrectQuestions) {
      sections.push("Most Incorrect Questions:");
      input.communityStats.mostIncorrectQuestions.forEach((q) => {
        sections.push(`  Q:${q.questionId} - ${q.failureRate}% incorrect`);
      });
    }
  }

  return sections.join("\n");
}
