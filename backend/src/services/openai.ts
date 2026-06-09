import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env.js";
import * as realtimeService from "./realtimeService.js";

function trackAiCall(
  feature: string, model: string, tokensIn: number, tokensOut: number,
  durationMs: number, success: boolean, userId?: string | null
) {
  import("../services/analyticsService.js").then((m) => {
    m.trackAiUsage(feature, model, tokensIn, tokensOut, durationMs, success, userId || null).catch(() => {});
  }).catch(() => {});
}

function getModelName(response: any): string {
  return response?.model || "llama-3.1-8b-instant";
}

function stripOuterCodeFences(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

type CompletionFn<T> = (signal?: AbortSignal) => Promise<T>;

async function trackedCompletion<T extends { usage?: { prompt_tokens?: number; completion_tokens?: number }; model?: string }>(
  feature: string,
  fn: CompletionFn<T>,
  userId?: string | null
): Promise<T> {
  const start = Date.now();
  let success = false;
  let model = "unknown";
  let tokensIn = 0;
  let tokensOut = 0;
  try {
    const result = await fn();
    success = true;
    model = getModelName(result);
    tokensIn = result.usage?.prompt_tokens || 0;
    tokensOut = result.usage?.completion_tokens || 0;
    return result;
  } finally {
    trackAiCall(feature, model, tokensIn, tokensOut, Date.now() - start, success, userId);
  }
}

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
- For MCQ questions: extract the EXACT options as they appear with type "MCQ". Each MCQ must have exactly 4 options.
- For subjective/descriptive/essay/short-answer/long-answer questions: set options to an empty array [] and type to "SUBJECTIVE". Include the correctAnswer as a model answer if available.
- Do NOT hallucinate answers or generate options that aren't in the text.
- Set "type" to "MCQ" or "SUBJECTIVE" based on the question type.
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

Output format (MCQ questions only — never subjective):
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
  if (t === "MCQ" || t === "MULTIPLE CHOICE" || t === "MULTIPLE_CHOICE" || t === "OBJECTIVE") return "MCQ";
  return "SUBJECTIVE";
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

async function analyzeChunk(text: string, userId?: string | null): Promise<ParsedQuestion[]> {
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
        trackedCompletion("mock_test_analysis", () =>
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
          userId
        ),
      signal
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");
    return content;
  };

  const parseQuestions = (raw: string): ParsedQuestion[] => {
    const cleaned = stripOuterCodeFences(raw);

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
    if (err?.status === 400 || err?.status === 413 || err?.message?.includes("Failed to generate JSON")) {
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
  text: string,
  userId?: string | null
): Promise<ParsedQuestion[]> {
  const chunks = chunkText(text);

  if (chunks.length <= 1) {
    return shuffleArray(await analyzeChunk(chunks[0] || text, userId));
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
    const questions = await analyzeChunk(chunks[i], userId);
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
  type: "short" | "detailed",
  userId?: string | null
): Promise<string> {
  const prompt =
    type === "short"
      ? `Explain this answer briefly (2-3 sentences) in simple terms.\nQuestion: ${question}\nAnswer: ${correctAnswer}`
      : `Provide a detailed step-by-step explanation for this answer. Use simple language. Include the concept and reasoning.\nQuestion: ${question}\nAnswer: ${correctAnswer}`;

  const response = await trackedCompletion("explanation", () =>
    client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: type === "short" ? 200 : 800,
    }),
    userId
  );

  return response.choices[0]?.message?.content || "";
}

export async function generateEmailContent(
  instructions: string,
  tone: string,
  userId?: string | null
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
        trackedCompletion("email_gen", () =>
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
          userId
        ),
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI during email generation");

    const cleaned = stripOuterCodeFences(content);

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
  instructions: string,
  userId?: string | null
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
    trackedCompletion("blog_gen", () =>
      client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
      userId
    )
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during blog generation");

  const cleaned = stripOuterCodeFences(content);
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
  instructions: string,
  userId?: string | null
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
    trackedCompletion("ad_gen", () =>
      client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
      userId
    )
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during ad generation");

  const cleaned = stripOuterCodeFences(content);
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
  userAnswer: string | null | undefined,
  correctAnswer: string,
  userId?: string | null
): Promise<SubjectiveEvaluation> {
  const answerText = userAnswer?.trim() || "(No answer provided)";

  const prompt = `You are an exam evaluator. Evaluate the student's answer to a subjective question.

Question: "${questionText}"

Expected answer: "${correctAnswer}"

Student's answer: "${answerText}"

Compare the student's answer against the expected answer. Identify what the student got right, what they missed, and any inaccuracies.

Respond with valid JSON only — no markdown, no code fences:
{
  "modelAnswer": "The complete correct/expected answer",
  "isCorrect": true,
  "feedback": "Constructive feedback comparing the student's answer with the expected answer — point out what was correct, what was missing or inaccurate, and how to improve"
}

Rules:
- isCorrect: true if fully correct, false if wrong, null if partially correct
- For partial credit (null): the student has some understanding but missed key points or made errors
- Be generous: if the student's answer captures the core concept, mark as correct (true)
- modelAnswer should match the expected answer provided above
- feedback must be specific, educational, and actionable — compare the student's answer against the expected answer directly
- If the student didn't answer, mark as false with appropriate feedback`;

  const response = await callWithRetry(() =>
    trackedCompletion("subjective_eval", () =>
      client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
      userId
    )
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during subjective evaluation");

  const cleaned = stripOuterCodeFences(content);
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
  userAnswer: string | null | undefined,
  userId?: string | null
): Promise<MCQExplanation> {
  const userChoice = userAnswer?.trim() || "(Not answered)";

  const prompt = `You are a tutor explaining a multiple-choice question to a student.

Question: "${questionText}"

Options:
${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}

Correct answer: "${correctAnswer}"
Student's chosen answer: "${userChoice}"

Explain why the correct answer is correct. If the student chose a wrong answer, explain why that answer is incorrect and what misconception it might reflect.

If the question involves code, wrap any code snippets in ${"```"}language fences within the explanation text.

Respond with valid JSON only — no markdown around the JSON itself:
{
  "shortExplanation": "A concise 2-3 sentence explanation of the key concept",
  "detailedExplanation": "A thorough, educational explanation covering why the correct answer is right and (if applicable) why the wrong answer is wrong"
}`;

  const response = await callWithRetry(() =>
    trackedCompletion("mcq_explanation", () =>
      client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
      userId
    )
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during MCQ explanation");

  const cleaned = stripOuterCodeFences(content);
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

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

const DIFFICULTY_MAX_TOKENS: Record<string, number> = {
  EASY: 3500,
  MEDIUM: 4000,
  HARD: 4500,
};

export interface QuizResult {
  questions: QuizQuestion[];
  totalTokens: number;
}

const quizQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
});

const quizResponseSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1, "At least 1 question required").max(10),
});

function tryParseQuizJSON(raw: string): any {
  const trimmed = raw.trim();
  // Attempt 1: direct parse
  try {
    return JSON.parse(trimmed);
  } catch { /* fall through */ }

  // Attempt 2: extract JSON object via regex
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch { /* fall through */ }
  }

  // Attempt 3: extract questions array and wrap
  const arrMatch = trimmed.match(/"questions"\s*:\s*\[[\s\S]*?\]\s*}/);
  if (arrMatch) {
    try {
      return JSON.parse(`{${arrMatch[0]}}`);
    } catch { /* fall through */ }
  }

  return null;
}

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

  // Heuristic: if the text has no long English words (>3 letters), it's likely a math expression
  const longEnglishWords = result.split(/\s+/).filter(w => /^[a-zA-Z]{4,}$/.test(w));
  const isMathExpression = longEnglishWords.length === 0 || result.length < 50;

  if (isMathExpression) {
    return `$${result.trim()}$`;
  }

  return result;
}

interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

function validateSvgCompleteness(svg: string): string[] {
  const issues: string[] = [];

  if (!svg.includes("</svg>")) {
    issues.push("SVG not closed (missing </svg>)");
  }
  if (!svg.includes("viewBox")) {
    issues.push("Missing viewBox attribute");
  }

  const textElements = svg.match(/<text[\s\S]*?<\/text>/g) || [];
  if (textElements.length < 2) {
    issues.push(`Only ${textElements.length} text label(s) found (minimum 2 required)`);
  } else {
    const emptyTexts = textElements.filter(t => {
      const inner = t.replace(/<text[^>]*>/, "").replace(/<\/text>/, "").trim();
      return inner.length === 0;
    });
    if (emptyTexts.length > 0) {
      issues.push(`${emptyTexts.length} text tag(s) have empty content`);
    }
  }

  const hasVisibleElements = /<(rect|circle|line|polygon|path|ellipse|polyline)\b/.test(svg);
  if (!hasVisibleElements) {
    issues.push("No visible shape elements found (rect, circle, line, polygon, path, etc.)");
  }

  return issues;
}

function validateQuizContent(
  questions: { questionText: string; options: string[]; correctAnswer: string }[],
  subject: string,
  topic: string,
  difficulty: string
): ValidationResult {
  const reasons: string[] = [];
  const topicKeywords = topic.toLowerCase().split(/\s+/).filter(k => k.length > 2);
  let topicFailCount = 0;
  let svgFailCount = 0;
  let trivialCount = 0;

  for (const q of questions) {
    const textLower = q.questionText.toLowerCase();

    // Topic relevance: check if question text contains topic keywords
    if (topicKeywords.length > 0) {
      const hasTopicKeyword = topicKeywords.some(kw => textLower.includes(kw));
      if (!hasTopicKeyword) topicFailCount++;
    }

    // SVG completeness: validate diagram structure
    if (q.questionText.includes("```svg")) {
      const svgMatch = q.questionText.match(/```svg\s*\n?([\s\S]*?)```/);
      if (!svgMatch) {
        svgFailCount++;
        continue;
      }
      const svg = svgMatch[1];
      const svgIssues = validateSvgCompleteness(svg);
      if (svgIssues.length > 0) {
        svgFailCount++;
      }
    }

    // Trivial/empty content check
    if (q.questionText.length < 15 || q.correctAnswer.length < 1 || q.options.some(o => o.length < 1)) {
      trivialCount++;
    }
  }

  if (topicFailCount >= questions.length) {
    reasons.push(`${topicFailCount}/${questions.length} questions lack topic keywords from "${topic}"`);
  }

  if (svgFailCount > 0) {
    reasons.push(`${svgFailCount} questions have incomplete or invalid SVG diagrams`);
  }

  if (trivialCount > 0) {
    reasons.push(`${trivialCount} questions have trivial or empty content`);
  }

  // Difficulty alignment heuristic
  if (difficulty === "EASY") {
    const complexCount = questions.filter(q =>
      /\$.*\\(int|sum|prod|lim|iint|iiint|oint|cup|cap|subset|supset|forall|exists|partial|nabla).*\$/.test(q.questionText)
    ).length;
    if (complexCount > 2) {
      reasons.push(`${complexCount} questions contain advanced notation inconsistent with EASY difficulty`);
    }
  } else if (difficulty === "MEDIUM") {
    const tooSimple = questions.filter(q => q.questionText.length < 30 && !/\$/.test(q.questionText)).length;
    const tooComplex = questions.filter(q =>
      /\$.*\\(iint|iiint|oint|cup|cap|subset|supset|forall|exists).*\$/.test(q.questionText)
    ).length;
    if (tooSimple > Math.floor(questions.length / 2)) {
      reasons.push(`${tooSimple} questions appear too simple for MEDIUM difficulty`);
    }
    if (tooComplex > 2) {
      reasons.push(`${tooComplex} questions contain advanced notation inconsistent with MEDIUM difficulty`);
    }
  } else if (difficulty === "HARD") {
    const trivialCount_hard = questions.filter(q => {
      const t = q.questionText;
      return t.length < 60 && !/\$/.test(t) && !t.includes("```");
    }).length;
    if (trivialCount_hard > Math.floor(questions.length / 2)) {
      reasons.push(`${trivialCount_hard} questions appear too simple for HARD difficulty`);
    }
  }

  return { valid: reasons.length === 0, reasons };
}

function normalizeQuestions(
  questions: { questionText: string; options: string[]; correctAnswer: string }[]
): { questionText: string; options: string[]; correctAnswer: string }[] {
  return questions.slice(0, 10).map((q) => {
    const options: string[] = q.options;
    let correctAnswer: string = q.correctAnswer;

    const letterIdx = "ABCD".indexOf(correctAnswer.trim().toUpperCase());
    if (letterIdx >= 0 && letterIdx < options.length) {
      correctAnswer = options[letterIdx].trim();
    }

    const optionMatch = correctAnswer.trim().match(/^option\s+([A-D])$/i);
    if (optionMatch) {
      const idx = "ABCD".indexOf(optionMatch[1].toUpperCase());
      if (idx >= 0 && idx < options.length) {
        correctAnswer = options[idx].trim();
      }
    }

    const norm = (s: string) =>
      s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    const normCorrect = norm(correctAnswer);
    for (const opt of options) {
      if (norm(opt) === normCorrect) {
        correctAnswer = opt.trim();
        break;
      }
    }

    return {
      questionText: normalizeMathNotation(q.questionText),
      options: options.map(normalizeMathNotation),
      correctAnswer: normalizeMathNotation(correctAnswer),
    };
  });
}

async function attemptQuizGeneration(
  prompt: string,
  model: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  userId?: string | null,
  signal?: AbortSignal
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  return callWithRetry(
    () =>
      trackedCompletion(
        "quiz_generation",
        () =>
          client.chat.completions.create({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: DIFFICULTY_MAX_TOKENS[difficulty] || 3500,
            response_format: { type: "json_object" },
          }),
        userId
      ),
    signal
  );
}

export async function generateQuiz(subject: string, topic: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM', userId?: string | null): Promise<QuizResult> {
  const reqId = `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  realtimeService.startAiRequest(reqId, "quiz_generation", userId || null);
  const difficultyDescriptions: Record<string, string> = {
    EASY: 'Basic recall and fundamental concept questions. Test simple definitions, formulas, and direct applications. Suitable for beginners.',
    MEDIUM: 'Application-level questions requiring understanding of concepts. Includes multi-step problems and moderate analysis. Suitable for intermediate learners.',
    HARD: 'Advanced multi-step problems requiring deep conceptual understanding, synthesis of multiple topics, and complex analytical thinking. Suitable for advanced students.',
  };

  const prompt = `You are an expert exam question creator for competitive exams (JEE, NEET, CUET, WBJEE). Generate exactly 10 multiple-choice questions for the subject "${subject}" on the topic "${topic}".

DIFFICULTY LEVEL: ${difficulty}
${difficultyDescriptions[difficulty]}

Each question must have exactly 4 options (labeled A, B, C, D) and exactly one correct answer.

RULES — STRICT ENFORCEMENT:
- All 10 questions must be at the "${difficulty}" difficulty level — do NOT mix difficulties
- EVERY question, option, and correct answer must be DIRECTLY related to the topic "${topic}" in the subject "${subject}". Never generate off-topic content.
- ALL 4 options for each question must be relevant to the specified topic — do not include generic or unrelated distractors
- The correct answer must be specifically about the topic "${topic}"
- Questions should be appropriate for competitive exam level (JEE, NEET, CUET, etc.)
- Each question must be unique
- Options must be plausible (not obviously wrong)
- If you cannot generate on-topic questions about "${topic}", return an error
- Return ONLY valid JSON with no markdown or code fences around the JSON itself

CONTENT FORMATTING INSTRUCTIONS:
- For coding questions: wrap code snippets in \`\`\`language\n...\n\`\`\` fences within the questionText and option strings. Example: "What is the output of\n\`\`\`python\nprint(2**3)\n\`\`\`"
- For math questions: ALL mathematical expressions MUST be wrapped in $...$ (inline) or $$...$$ (display math) delimiters within the questionText and option strings. This is CRITICAL for proper rendering.
- Both code fences and math delimiters should be embedded INSIDE the JSON string values

MATH FORMATTING RULES — CRITICAL:
You MUST use proper LaTeX notation with $...$ delimiters. NEVER use plain text math like x^2, H_2O, sqrt(4), or unicode symbols (π, √, ∫, Σ) without $...$ wrappers.

LaTeX patterns: $x^2$, $x^{n+1}$, $H_2O$, $x_n$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\sqrt[3]{x}$, $\\pi$, $\\theta$, $\\Delta$, $\\int_{a}^{b} f(x) dx$, $\\sum_{i=1}^{n} x_i$, $\\prod_{i=1}^{n} i$, $\\lim_{x \\to 0}$, $\\pm$, $\\times$, $\\div$, $\\neq$, $\\leq$, $\\geq$, $\\approx$, $\\infty$, $\\sin x$, $\\cos \\theta$, $\\log x$, $\\ln x$, $\\in$, $\\subset$, $\\cup$, $\\cap$, $\\emptyset$, $\\forall$, $\\exists$, $\\begin{matrix} a & b \\\\ c & d \\end{matrix}$

✅ "Solve $x^2 + 2x + 1 = 0$"  ✅ "$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"  ✅ "The formula for water is $H_2O$"
❌ "x^2 + 1 = 0" (no $)  ❌ "sqrt(4) = 2" (no $)  ❌ "H₂O" (no $)  ❌ "pi = 3.14" (no $)

DIAGRAM FORMATTING — For visual questions embed SVG via \`\`\`svg\n<svg viewBox='0 0 W H'>...\n\`\`\` at the START of questionText. SVG rules: use viewBox, proper elements (<rect>, <circle>, <line>, <polygon>, <path>, <text>), fill/stroke colors, font-family="sans-serif", text-anchor="middle" for labels. Example:

GEOMETRY TRIANGLE:
<svg viewBox="0 0 400 300" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
<polygon points="200,20 20,280 380,280" fill="none" stroke="#333" stroke-width="2"/>
<text x="200" y="12" text-anchor="middle" font-size="16">A</text>
<text x="12" y="284" font-size="16">B</text>
<text x="388" y="284" text-anchor="end" font-size="16">C</text>
</svg>

Any diagram type works: triangles, coordinate planes (with axes lines + labels), circuits (lines + circles + labels), flowcharts (rects + lines + text), Venn diagrams, bar charts, graphs, chemical structures, etc. Always put \`\`\`svg at the beginning of questionText, then the question text after \`\`\`.

IMPORTANT — SVG COMPLETENESS RULES (MUST FOLLOW):
- Every \`\`\`svg block must contain a COMPLETE, fully closed <svg>...</svg> element with </svg> present
- Must include viewBox attribute
- Minimum 2 <text> label elements with non-empty text content
- Must include at least one visible shape element (<rect>, <circle>, <line>, <polygon>, <path>, <ellipse>, <polyline>)
- Do NOT truncate or omit any SVG tags — the entire diagram must be fully rendered
- NEVER output broken, empty, or partial SVG markup

CRITICAL — correctAnswer FORMAT:
The "correctAnswer" field MUST be the EXACT and COMPLETE text of the correct option from the "options" array.
Do NOT use a letter like "A" or "B".
Do NOT use a label like "Option A".
Example:
  ✅ CORRECT: "options": ["$2\\pi\\sqrt{\\frac{L}{g}}$", "$2\\pi\\sqrt{\\frac{g}{L}}$", "$\\pi\\sqrt{\\frac{L}{g}}$", "$\\pi\\sqrt{\\frac{g}{L}}$"], "correctAnswer": "$2\\pi\\sqrt{\\frac{L}{g}}$"
  ❌ WRONG:   "correctAnswer": "A"
  ❌ WRONG:   "correctAnswer": "Option A"

{
  "questions": [
    {
      "questionText": "\`\`\`svg\n<svg viewBox='0 0 400 300' width='100%' height='auto' xmlns='http://www.w3.org/2000/svg'>\n<polygon points='200,20 20,280 380,280' fill='none' stroke='#333' stroke-width='2'/>\n<text x='200' y='12' text-anchor='middle' font-size='16'>A</text>\n<text x='12' y='284' font-size='16'>B</text>\n<text x='388' y='284' text-anchor='end' font-size='16'>C</text>\n</svg>\n\`\`\`\nIn triangle ABC above, $AB = 5$, $BC = 12$. Find $AC$.",
      "options": ["$13$", "$17$", "$\\sqrt{119}$", "$7$"],
      "correctAnswer": "$13$"
    },
    {
      "questionText": "What is the value of $\\int_{0}^{\\pi} \\sin x \\, dx$?",
      "options": ["$0$", "$1$", "$2$", "$\\pi$"],
      "correctAnswer": "$2$"
    }
  ]
}`;

  // Total timeout guard: 60 seconds for the entire generation process
  const QUIZ_TIMEOUT_MS = 60000;
  const generationPromise = (async () => {

  // Retry loop with content validation: 8B up to 3 attempts → fallback to 70B
  let currentPrompt = prompt;
  let used70B = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    let response: OpenAI.Chat.Completions.ChatCompletion;
    try {
      if (attempt > 0) console.log(`[openai] Quiz generation retry ${attempt + 1}/3`);
      response = await attemptQuizGeneration(currentPrompt, "llama-3.1-8b-instant", difficulty, userId);
    } catch (err: any) {
      if (err?.status === 400 || err?.status === 413 || err?.message?.includes("Failed to generate JSON")) {
        console.log("[openai] 8B model failed, falling back to 70B...");
        used70B = true;
        try {
          response = await attemptQuizGeneration(currentPrompt, "llama-3.3-70b-versatile", difficulty, userId);
        } catch (err2: any) {
          console.error("[openai] 70B fallback also failed:", err2?.message);
          throw new Error("Unable to generate quiz at this time. Please try again.");
        }
        // Process 70B response (no retry for 70B)
        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Unable to generate quiz at this time. Please try again.");

        const totalTokens = response.usage?.total_tokens || 0;
        const cleaned = stripOuterCodeFences(content);
        const parsed = tryParseQuizJSON(cleaned);
        if (!parsed) throw new Error("Unable to generate quiz at this time. Please try again.");

        const validation = quizResponseSchema.safeParse(parsed);
        if (!validation.success) throw new Error("Unable to generate quiz at this time. Please try again.");

        const rawQuestions = validation.data.questions.slice(0, 10);
        const valResult = validateQuizContent(rawQuestions, subject, topic, difficulty);
        if (!valResult.valid) {
          console.warn("[openai] 70B content validation failed:", valResult.reasons.join("; "));
          throw new Error("Unable to generate quiz at this time. Please try again.");
        }

        const normalized = normalizeQuestions(rawQuestions);
        try {
          return { questions: normalized, totalTokens };
        } finally {
          realtimeService.endAiRequest(reqId);
        }
      }
      console.error("[openai] Quiz generation API error:", err?.status, err?.message);
      throw new Error("Unable to generate quiz at this time. Please try again.");
    }

    // Process and validate 8B response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn(`[openai] Empty response on attempt ${attempt + 1}, retrying...`);
      continue;
    }

    const totalTokens = response.usage?.total_tokens || 0;
    const cleaned = stripOuterCodeFences(content);
    const parsed = tryParseQuizJSON(cleaned);
    if (!parsed) {
      console.warn(`[openai] Failed to parse quiz JSON on attempt ${attempt + 1}, retrying...`);
      continue;
    }

    const validation = quizResponseSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn(`[openai] Zod validation failed on attempt ${attempt + 1}, retrying...`);
      continue;
    }

    const rawQuestions = validation.data.questions.slice(0, 10);
    const valResult = validateQuizContent(rawQuestions, subject, topic, difficulty);
    if (valResult.valid) {
      const normalized = normalizeQuestions(rawQuestions);
      try {
        return { questions: normalized, totalTokens };
      } finally {
        realtimeService.endAiRequest(reqId);
      }
    }

    console.warn(`[openai] Content validation failed (attempt ${attempt + 1}/3):`, valResult.reasons.join("; "));

    // Enhance prompt with specific feedback for next retry
    const hints: string[] = [];
    if (valResult.reasons.some(r => r.includes("SVG"))) {
      hints.push("Each ```svg block must contain a complete <svg>...</svg> element with viewBox, visible shapes (rect/circle/line/polygon/path), and at least 2 non-empty text labels. Do not truncate or omit any elements.");
    }
    if (valResult.reasons.some(r => r.includes("topic"))) {
      hints.push(`Every question must be specifically about "${topic}" in "${subject}". Ensure all content directly relates to this topic.`);
    }
    if (valResult.reasons.some(r => r.includes("trivial"))) {
      hints.push("Each question needs meaningful text (15+ characters), 4 non-empty options, and a complete correct answer.");
    }
    if (hints.length > 0) {
      currentPrompt += `\n\n⚠️ QUALITY ISSUE — ${hints.join(" ")}`;
    }
  }

  // All 8B attempts exhausted without valid content — try 70B
  if (!used70B) {
    console.log("[openai] 8B model exhausted, trying 70B fallback...");
    try {
      const response = await attemptQuizGeneration(currentPrompt, "llama-3.3-70b-versatile", difficulty, userId);
      const content = response.choices[0]?.message?.content;
      if (content) {
        const totalTokens = response.usage?.total_tokens || 0;
        const cleaned = stripOuterCodeFences(content);
        const parsed = tryParseQuizJSON(cleaned);
        if (parsed) {
          const validation = quizResponseSchema.safeParse(parsed);
          if (validation.success) {
            const rawQuestions = validation.data.questions.slice(0, 10);
            const valResult = validateQuizContent(rawQuestions, subject, topic, difficulty);
            if (valResult.valid) {
              const normalized = normalizeQuestions(rawQuestions);
              try {
                return { questions: normalized, totalTokens };
              } finally {
                realtimeService.endAiRequest(reqId);
              }
            }
            console.warn("[openai] 70B content validation also failed:", valResult.reasons.join("; "));
          }
        }
      }
    } catch (err: any) {
      console.error("[openai] 70B fallback failed:", err?.message);
    }
  }

  throw new Error("Unable to generate quiz at this time. Please try again.");
  })();

  return Promise.race([
    generationPromise,
    new Promise<QuizResult>((_, reject) =>
      setTimeout(() => reject(new Error("Quiz generation timed out")), QUIZ_TIMEOUT_MS)
    ),
  ]).catch((err: any) => {
    if (err?.message === "Quiz generation timed out") {
      console.error(`[openai] Quiz generation timed out after ${QUIZ_TIMEOUT_MS}ms (subject="${subject}", topic="${topic}", difficulty=${difficulty})`);
      realtimeService.endAiRequest(reqId);
    }
    throw err;
  });
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

export async function generateAnalysisReport(input: AnalysisInput, userId?: string | null): Promise<AnalysisReport> {
  const prompt = buildAnalysisPrompt(input);

  const response = await Promise.race([
    trackedCompletion("analysis_report", () =>
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
      userId
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Analysis generation timeout")), 180000)
    ),
  ]);

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI during analysis generation");

  const cleaned = stripOuterCodeFences(content);

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
    const wrong = input.userAnswers.filter((a) => a.isCorrect !== true).length;
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
