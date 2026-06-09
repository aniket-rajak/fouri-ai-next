import { Router } from "express";
import { z } from "zod";
import { standardLimiter } from "../middleware/rateLimiter.js";
import OpenAI from "openai";

const router = Router();

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const explainSchema = z.object({
  questions: z.array(z.object({
    questionText: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.string(),
    userAnswer: z.string().optional().nullable(),
  })),
});

router.post("/explain", standardLimiter, async (req, res) => {
  try {
    const parsed = explainSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.issues.map(i => i.message) });
      return;
    }

    const { questions } = parsed.data;

    const explanations = await Promise.all(
      questions.map(async (q) => {
        const isCorrect = q.userAnswer?.trim() === q.correctAnswer.trim();
        const prompt = `You are an expert exam tutor for competitive exams.

Question: "${q.questionText}"
Options: ${JSON.stringify(q.options)}
Correct Answer: "${q.correctAnswer}"
User's Answer: "${q.userAnswer || "Not answered"}"
Status: ${isCorrect ? "CORRECT" : "INCORRECT"}

Provide a brief explanation (2-3 sentences) about why the correct answer is correct.
${isCorrect ? "" : "Also provide one specific improvement suggestion for this type of question."}

If the question involves code, wrap any code snippets in ${"```"}language fences within the explanation text.

Respond in JSON format:
{
  "explanation": "Brief explanation here",
  "improvementSuggestion": "Suggestion here or empty string if correct"
}`;

        try {
          const response = await client.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 300,
            response_format: { type: "json_object" },
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            const parsedContent = JSON.parse(content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim());
            return {
              isCorrect,
              explanation: parsedContent.explanation || "No explanation available.",
              improvementSuggestion: parsedContent.improvementSuggestion || "",
            };
          }
        } catch {
          // fall through
        }

        return {
          isCorrect,
          explanation: `The correct answer is "${q.correctAnswer}". Review the topic material for more details.`,
          improvementSuggestion: "",
        };
      })
    );

    res.json({ explanations });
  } catch (error: any) {
    console.error("[quizExplain] Error:", error?.message || error);
    res.status(500).json({ error: "Failed to generate explanations" });
  }
});

export default router;
