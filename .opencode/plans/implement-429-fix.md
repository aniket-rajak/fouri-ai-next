# Plan: Fix 429 Too Many Requests

## Goal
Eliminate OpenAI/OpenRouter 429 rate limit errors when evaluating subjective answers with AI.

## Changes

### 1. `frontend/src/app/(dashboard)/results/[id]/page.tsx`

**A. Add retry helper** at module level (before `export default function`):

```typescript
async function apiPostWithRetry(url: string, body: unknown, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await api.post(url, body);
    } catch (error: any) {
      if (error?.response?.status === 429 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw error;
    }
  }
}
```

**B. Add early-return guard** at top of `evaluateWithAi`:

```typescript
const evaluateWithAi = useCallback(async (answerId: string, questionId: string) => {
  if (evaluating[questionId]) return;  // prevent duplicate calls
  // ... rest unchanged
```

**C. Replace `api.post` call** inside `evaluateWithAi`:

```typescript
// Before (line ~80):
const res = await api.post(`/attempts/${attempt.id}/evaluate-subjective-ai`, { questionId });

// After:
const res = await apiPostWithRetry(`/attempts/${attempt.id}/evaluate-subjective-ai`, { questionId });
```

### 2. `backend/src/services/openai.ts`

**Wrap the `client.chat.completions.create()` call** in `evaluateSubjectiveWithAI` with retry logic (around line 206):

```typescript
let lastError: unknown;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI during subjective evaluation");

    const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
    const parsed = JSON.parse(cleaned);

    return {
      modelAnswer: parsed.modelAnswer || "",
      feedback: parsed.feedback || "",
      isCorrect: parsed.isCorrect === undefined ? null : parsed.isCorrect,
    };
  } catch (error: any) {
    lastError = error;
    const isRateLimit =
      error?.status === 429 ||
      error?.code === "rate_limit" ||
      error?.message?.includes("429") ||
      error?.message?.includes("rate limit");
    if (!isRateLimit || attempt === 3) throw error;
    console.warn(`[openai] 429 on attempt ${attempt}. Retrying in ${2000 * attempt}ms...`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}
throw lastError;
```

### 3. `backend/src/lib/evaluationQueue.ts` (NEW FILE)

```typescript
interface Task<T = unknown> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

class EvaluationQueue {
  private queue: Task[] = [];
  private running = false;

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.queue.push({ fn, resolve: resolve as any, reject: reject as any });
      if (!this.running) this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try {
        task.resolve(await task.fn());
      } catch (error) {
        task.reject(error);
      }
    }
    this.running = false;
  }
}

export const evaluationQueue = new EvaluationQueue();
```

### 4. `backend/src/routes/attempts.ts`

**Import the queue** at the top:

```typescript
import { evaluationQueue } from "../lib/evaluationQueue.js";
```

**Wrap the AI call** in the `/evaluate-subjective-ai` handler (~line 357):

```typescript
// Before:
const evaluation = await evaluateSubjectiveWithAI(
  question.questionText,
  answer?.selectedOption
);

// After:
const evaluation = await evaluationQueue.enqueue(() =>
  evaluateSubjectiveWithAI(
    question.questionText,
    answer?.selectedOption
  )
);
```

## Verification
After applying, run:
- `cd backend && npx tsc --noEmit`
- `cd frontend && npx next build`
