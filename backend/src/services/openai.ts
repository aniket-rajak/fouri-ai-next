import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.openai.apiKey,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://fouri.in",
    "X-Title": "FOURI.IN",
  },
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

const SYSTEM_PROMPT = `You are an OCR text analyzer. Given OCR text from a question paper, extract ALL questions exactly as they appear.

CRITICAL RULES:
- Extract EVERY question present in the text. Do not skip any. Do not limit to a fixed number.
- Return ONLY a valid JSON object with a "questions" array. No markdown, no explanation.
- For each question, set "subject" to the exam subject name mentioned in the paper header (e.g., "Mathematics", "English", "Physics"). If no subject is found, set it to "General".
- Copy the question text EXACTLY as it appears. Do NOT rephrase, summarize, or modify.
- For MCQs: extract the EXACT options as they appear. Do not add or change options.
- For subjective questions: options=[], correctAnswer="" and type="SUBJECTIVE".
- Set correctAnswer to the EXACT answer text shown in the paper. If no answer key is present, leave it as empty string.
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

export async function analyzeQuestions(
  text: string
): Promise<ParsedQuestion[]> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0.1,
    max_tokens: 16384,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  const parsed = JSON.parse(cleaned);
  const questions: ParsedQuestion[] = parsed.questions || parsed;

  if (!Array.isArray(questions)) {
    throw new Error("Invalid response format from OpenAI");
  }

  return shuffleArray(questions.map((q) => {
    let options: string[] = [];
    if (Array.isArray(q.options)) options = q.options;
    else if (typeof q.options === "string") {
      try { options = JSON.parse(q.options); }
      catch { options = []; }
    }
    return {
      question: q.question,
      options,
      correctAnswer: q.correctAnswer || "",
      type: normalizeType(q.type),
      difficulty: normalizeDifficulty(q.difficulty),
      topic: q.topic,
      subject: q.subject,
    };
  }));
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
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: type === "short" ? 200 : 800,
  });

  return response.choices[0]?.message?.content || "";
}
