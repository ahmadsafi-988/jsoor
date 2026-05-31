import type { Json } from "@/lib/supabase_generated_types";

export const ASSESSMENT_SUBMISSIONS_BUCKET = "assessment-submissions";
export const ASSESSMENT_FILE_MAX_SIZE = 10 * 1024 * 1024;
export const ASSESSMENT_FILE_EXTENSIONS = ["pdf", "doc", "docx", "png", "jpg", "jpeg", "zip"] as const;

export type OpenAnswerType = "text" | "url" | "file";

export type AssessmentFileAnswer = {
  path: string;
  name: string;
  type: string;
  size: number;
};

export type OpenAnswer = {
  text?: string;
  url?: string;
  file?: AssessmentFileAnswer;
};

export type OpenQuestion = {
  type: "open";
  question: string;
  points?: number;
  allowTextAnswer?: boolean;
  allowUrlAnswer?: boolean;
  allowFileUpload?: boolean;
  requiredAnswerTypes?: OpenAnswerType[];
};

export type McqQuestion = {
  type: "mcq";
  question: string;
  options: string[];
  correct: number;
  points?: number;
};

export type MultiSelectQuestion = {
  type: "multiselect";
  question: string;
  options: string[];
  correct: number[];
  points?: number;
};

export type TrueFalseQuestion = {
  type: "truefalse";
  question: string;
  correct: boolean;
  points?: number;
};

export type AssessmentQuestion =
  | OpenQuestion
  | McqQuestion
  | MultiSelectQuestion
  | TrueFalseQuestion
  | {
      id?: string | number;
      type?: string;
      text?: string;
      question?: string;
      options?: string[];
      correct?: number | number[] | boolean;
      points?: number;
      [key: string]: unknown;
    };

export function getQuestionPoints(question: AssessmentQuestion): number {
  const points = Number((question as { points?: unknown }).points);
  return Number.isInteger(points) && points > 0 ? points : 1;
}

export function getOpenAnswerMethods(question: AssessmentQuestion) {
  if (question.type !== "open") {
    return { text: false, url: false, file: false, required: [] as OpenAnswerType[] };
  }

  const hasV3Flags =
    "allowTextAnswer" in question ||
    "allowUrlAnswer" in question ||
    "allowFileUpload" in question;

  return {
    text: hasV3Flags ? question.allowTextAnswer === true : true,
    url: question.allowUrlAnswer === true,
    file: question.allowFileUpload === true,
    required: Array.isArray(question.requiredAnswerTypes)
      ? question.requiredAnswerTypes.filter(isOpenAnswerType)
      : [],
  };
}

export function isAutoGradable(question: AssessmentQuestion): boolean {
  return question.type === "mcq" || question.type === "truefalse" || question.type === "multiselect";
}

function isOpenAnswerType(value: unknown): value is OpenAnswerType {
  return value === "text" || value === "url" || value === "file";
}

function getOpenAnswer(answer: unknown): OpenAnswer {
  if (!answer) return {};
  if (typeof answer === "string") return { text: answer };
  if (typeof answer === "object" && !Array.isArray(answer)) return answer as OpenAnswer;
  return {};
}

export function isUrlish(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function areNumberSetsEqual(a: unknown, b: unknown): boolean {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const left = a.map(Number).filter(Number.isInteger).sort((x, y) => x - y);
  const right = b.map(Number).filter(Number.isInteger).sort((x, y) => x - y);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function isAnswerCorrect(question: AssessmentQuestion, answer: unknown): boolean {
  if (question.type === "mcq" || question.type === "truefalse") return answer === question.correct;
  if (question.type === "multiselect") return areNumberSetsEqual(answer, question.correct);
  return false;
}

export function scoreAssessment(
  questions: AssessmentQuestion[],
  answers: Record<string, unknown>,
) {
  let earnedPoints = 0;
  let possiblePoints = 0;

  questions.forEach((question, index) => {
    if (!isAutoGradable(question)) return;
    const points = getQuestionPoints(question);
    possiblePoints += points;
    if (isAnswerCorrect(question, answers[String(index)])) earnedPoints += points;
  });

  return {
    earnedPoints,
    possiblePoints,
    score: possiblePoints > 0 ? Math.round((earnedPoints / possiblePoints) * 100) : null,
  };
}

export function normalizeAssessmentQuestions(raw: unknown): {
  questions: AssessmentQuestion[];
  error?: string;
} {
  if (!Array.isArray(raw)) return { questions: [], error: "Questions must be a list." };

  const questions: AssessmentQuestion[] = [];

  for (const [index, candidate] of raw.entries()) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return { questions: [], error: `Question ${index + 1} is invalid.` };
    }

    const q = candidate as Record<string, unknown>;
    const type = q.type;
    const question =
      typeof q.question === "string"
        ? q.question.trim()
        : typeof q.text === "string"
          ? q.text.trim()
          : "";
    const points = Number(q.points ?? 1);
    if (!question) return { questions: [], error: `Question ${index + 1} needs text.` };
    if (!Number.isInteger(points) || points <= 0) {
      return { questions: [], error: `Question ${index + 1} needs positive whole-number points.` };
    }

    if (type === "open" || !type) {
      const openCandidate = q as OpenQuestion;
      const methods = getOpenAnswerMethods({
        type: "open",
        question,
        allowTextAnswer: openCandidate.allowTextAnswer,
        allowUrlAnswer: openCandidate.allowUrlAnswer,
        allowFileUpload: openCandidate.allowFileUpload,
        requiredAnswerTypes: openCandidate.requiredAnswerTypes,
      });

      if (!methods.text && !methods.url && !methods.file) {
        return { questions: [], error: `Question ${index + 1} must allow at least one answer method.` };
      }

      const requiredAnswerTypes = methods.required.filter(
        (method) => method === "text" ? methods.text : method === "url" ? methods.url : methods.file,
      );

      questions.push({
        type: "open",
        question,
        points,
        allowTextAnswer: methods.text,
        allowUrlAnswer: methods.url,
        allowFileUpload: methods.file,
        requiredAnswerTypes,
      });
      continue;
    }

    if (type === "mcq" || type === "multiselect") {
      const options = Array.isArray(q.options)
        ? q.options.map((option) => String(option ?? "").trim()).filter(Boolean)
        : [];
      if (options.length < 2) {
        return { questions: [], error: `Question ${index + 1} needs at least two options.` };
      }

      if (type === "mcq") {
        const correct = Number(q.correct);
        if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
          return { questions: [], error: `Question ${index + 1} needs one correct answer.` };
        }
        questions.push({ type: "mcq", question, options, correct, points });
        continue;
      }

      const correct = Array.isArray(q.correct)
        ? [...new Set(q.correct.map(Number).filter((answer) => Number.isInteger(answer) && answer >= 0 && answer < options.length))]
        : [];
      if (correct.length === 0) {
        return { questions: [], error: `Question ${index + 1} needs at least one correct answer.` };
      }
      questions.push({ type: "multiselect", question, options, correct, points });
      continue;
    }

    if (type === "truefalse") {
      questions.push({ type: "truefalse", question, correct: q.correct === true, points });
      continue;
    }

    return { questions: [], error: `Question ${index + 1} has an unsupported type.` };
  }

  return { questions };
}

export function validateAssessmentSubmission(
  questions: AssessmentQuestion[],
  answers: Record<string, unknown>,
): string | null {
  for (const [index, question] of questions.entries()) {
    if (question.type !== "open") continue;
    const methods = getOpenAnswerMethods(question);
    const answer = getOpenAnswer(answers[String(index)]);
    const label = `Question ${index + 1}`;

    if (!methods.text && !methods.url && !methods.file) {
      return `${label} is not configured with an answer method.`;
    }

    if (!methods.text && answer.text?.trim()) return `${label} does not accept a written answer.`;
    if (!methods.url && answer.url?.trim()) return `${label} does not accept a link answer.`;
    if (!methods.file && answer.file) return `${label} does not accept a file upload.`;
    if (answer.url?.trim() && !isUrlish(answer.url.trim())) return `${label} needs a valid http(s) link.`;

    for (const required of methods.required) {
      if (required === "text" && !answer.text?.trim()) return `${label} requires a written answer.`;
      if (required === "url" && !answer.url?.trim()) return `${label} requires a link answer.`;
      if (required === "file" && !answer.file?.path) return `${label} requires a file upload.`;
    }
  }

  return null;
}

export function sanitizeQuestionsForJobSeeker(
  questions: AssessmentQuestion[],
  answers: Record<string, unknown>,
  resultsReleased: boolean,
) {
  return questions.map((question, index) => {
    const rest = { ...(question as AssessmentQuestion & { correct?: unknown }) };
    delete rest.correct;
    if (resultsReleased && isAutoGradable(question)) {
      return { ...rest, isCorrect: isAnswerCorrect(question, answers[String(index)]) };
    }
    return rest;
  }) as Json;
}

export function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAllowedAssessmentFile(file: File): string | null {
  if (file.size > ASSESSMENT_FILE_MAX_SIZE) return "Files must be 10MB or smaller.";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ASSESSMENT_FILE_EXTENSIONS.includes(extension as (typeof ASSESSMENT_FILE_EXTENSIONS)[number])) {
    return "Use a PDF, DOC, DOCX, PNG, JPG, JPEG, or ZIP file.";
  }
  return null;
}
