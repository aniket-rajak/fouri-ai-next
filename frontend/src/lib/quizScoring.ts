export function isAnswerCorrect(
  userAnswer: string | undefined | null,
  correctAnswer: string,
  options: string[]
): boolean {
  if (!userAnswer) return false;
  const ua = userAnswer.trim();
  const ca = correctAnswer.trim();
  if (!ua || !ca) return false;

  // 1. Exact match (trimmed)
  if (ua === ca) return true;

  // 2. correctAnswer is a letter A-D → compare with options[index]
  const letterIndex = "ABCD".indexOf(ca.toUpperCase());
  if (letterIndex >= 0 && letterIndex < options.length) {
    if (ua === options[letterIndex].trim()) return true;
  }

  // 3. correctAnswer is "Option A" format → extract letter and compare
  const optionMatch = ca.match(/^option\s+([A-D])$/i);
  if (optionMatch) {
    const idx = "ABCD".indexOf(optionMatch[1].toUpperCase());
    if (idx >= 0 && idx < options.length) {
      if (ua === options[idx].trim()) return true;
    }
  }

  // 4. Normalized comparison (lowercase, no punctuation, no extra spaces)
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  if (normalize(ua) === normalize(ca)) return true;

  // 5. Check if options array contains the correctAnswer text
  for (const opt of options) {
    if (normalize(opt) === normalize(ca)) {
      return ua === opt.trim();
    }
  }

  return false;
}

export function computeScore(
  answers: Record<number, string> | null | undefined,
  questions: Array<{ options: string[]; correctAnswer: string }> | null | undefined
): { correct: number; total: number; accuracy: number } {
  const qs = questions || [];
  const ans = answers || {};
  const total = qs.length;
  let correct = 0;

  qs.forEach((q, i) => {
    if (isAnswerCorrect(ans[i], q.correctAnswer, q.options)) {
      correct++;
    }
  });

  return {
    correct,
    total,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

export function getAnswerStatus(
  userAnswer: string | undefined | null,
  correctAnswer: string,
  options: string[]
): "correct" | "incorrect" | "unanswered" {
  if (!userAnswer || !userAnswer.trim()) return "unanswered";
  return isAnswerCorrect(userAnswer, correctAnswer, options) ? "correct" : "incorrect";
}
