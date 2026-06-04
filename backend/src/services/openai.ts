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
- Preserve mathematical expressions exactly as written (e.g., "x^2 + y^2 = r^2").
- Fix only obvious OCR spacing/encoding artifacts (e.g., merged words).

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

const MAX_CHUNK_CHARS = 3000;
const CHUNK_OUTPUT_TOKENS = 3000;
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
  const attempt = async (prompt: string) => {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: CHUNK_OUTPUT_TOKENS,
      })
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

  const raw = await attempt(SYSTEM_PROMPT);
  try {
    return parseQuestions(raw);
  } catch (err) {
    console.error(`[openai] Chunk parsing failed with primary prompt. Raw response (first 500 chars): ${raw.slice(0, 500)}`);
    console.log(`[openai] Retrying chunk with simplified fallback prompt...`);
    const fallbackRaw = await attempt(CHUNK_RETRY_FALLBACK_PROMPT);
    return parseQuestions(fallbackRaw);
  }
}

const CHUNK_DELAY_MS = 60000;

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

  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during email generation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  const parsed = JSON.parse(cleaned);

  return {
    subject: parsed.subject || "",
    body: parsed.body || "",
    ctaText: parsed.ctaText || "",
  };
}

export interface SubjectiveEvaluation {
  modelAnswer: string;
  feedback: string;
  isCorrect: boolean | null;
}

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit =
        error?.status === 429 ||
        error?.code === "rate_limit" ||
        error?.message?.includes("429") ||
        error?.message?.includes("rate limit");
      if (!isRateLimit || attempt === 3) throw error;
      console.warn(`[openai] 429 on attempt ${attempt}/3. Retrying in ${2000 * attempt}ms...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
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
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during blog generation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  const parsed = JSON.parse(cleaned);

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
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during ad generation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  const parsed = JSON.parse(cleaned);

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
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI during subjective evaluation");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  const parsed = JSON.parse(cleaned);

  return {
    modelAnswer: parsed.modelAnswer || "",
    feedback: parsed.feedback || "",
    isCorrect: parsed.isCorrect === undefined ? null : parsed.isCorrect,
  };
}
