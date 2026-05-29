import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callOpenAI(prompt: string, system: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    max_tokens: 1000,
  });

  return response.choices?.[0]?.message?.content ?? "";
}

async function generateQuestions(config: InterviewConfig): Promise<Question[]> {
  const system =
    "You are an expert technical recruiter. Respond ONLY with valid JSON — no markdown, no explanation. Return an array of objects with shape {id: number, text: string}.";

  const prompt = `Generate ${config.questionCount} realistic interview questions for a ${config.jobTitle} role.
Job description: ${config.jobDescription}
Mix behavioural, situational, and role-specific questions. Return JSON array only.`;

  const raw = await callOpenAI(prompt, system);
  const clean = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(clean) as Question[];
}

async function evaluateAnswers(
  config: InterviewConfig,
  questions: Question[],
  answers: Answer[]
): Promise<{ feedback: FeedbackItem[]; overallSummary: string }> {
  const system =
    "You are a senior hiring manager giving structured interview feedback. Respond ONLY with valid JSON — no markdown fences.";

  const qa = questions.map((q) => {
    const a = answers.find((a) => a.questionId === q.id);

    return `Q${q.id}: ${q.text}\nA${q.id}: ${
      a?.text || "(no answer provided)"
    }`;
  });

  const prompt = `You interviewed a candidate for ${config.jobTitle}.
Job description: ${config.jobDescription}

${qa.join("\n\n")}

Return JSON with shape:
{
  "feedback": [
    {"questionId": number, "score": number, "strengths": "string", "improvements": "string"}
  ],
  "overallSummary": "2-3 sentence overall assessment"
}`;

  const raw = await callOpenAI(prompt, system);
  const clean = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(clean);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // ─── Whisper STT ─────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const action = formData.get("action");
      const audioFile = formData.get("audio") as File | null;

      if (action !== "transcribe") {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      if (!audioFile) {
        return NextResponse.json(
          { error: "No audio file provided" },
          { status: 400 }
        );
      }

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
      });

      return NextResponse.json({ text: transcription.text });
    }

    // ─── JSON Actions ────────────────────────────
    const body = await request.json();
    const { action } = body;

    if (action === "generateQuestions") {
      const result = await generateQuestions(body.config);
      return NextResponse.json(result);
    }

    if (action === "evaluateAnswers") {
      const result = await evaluateAnswers(
        body.config,
        body.questions,
        body.answers
      );

      return NextResponse.json(result);
    }

    // ─── TTS ─────────────────────────────────────
    if (action === "tts") {
      const { text } = body as { text: string };

      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
        speed: 0.95,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      return new Response(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}