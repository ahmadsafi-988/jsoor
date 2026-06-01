import OpenAI from "openai";
import { NextResponse } from "next/server";

let openaiClient: OpenAI | null = null;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  openaiClient ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openaiClient;
}

async function callOpenAI(prompt: string, system: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
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
    "You are an experienced technical recruiter who specializes in hiring entry-level candidates. Your questions are clear, fair, and designed to help first-time job seekers demonstrate their potential — not just their experience. Respond ONLY with valid JSON — no markdown, no explanation. Return an array of objects with shape {id: number, text: string}.";

  const prompt = `Generate ${config.questionCount} realistic, entry-level-appropriate interview questions for a ${config.jobTitle} role.

Job description: ${config.jobDescription}

Guidelines:
- Assume the candidate is a recent graduate or career switcher with limited professional experience
- Avoid questions that require years of work experience to answer (e.g. "Tell me about a time you led a team of 10")
- Instead, allow candidates to draw from internships, academic projects, volunteering, part-time work, or coursework
- Use simple, jargon-free language

Return a JSON array only. No explanation, no markdown.`;

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
    "You are a supportive but honest senior hiring manager evaluating entry-level candidates. Your feedback is constructive, specific, and encouraging — you recognise potential and effort, not just polished delivery. You understand these candidates may have limited professional experience. Respond ONLY with valid JSON — no markdown fences.";

  const qa = questions.map((q) => {
    const a = answers.find((a) => a.questionId === q.id);
    return `Q${q.id}: ${q.text}\nA${q.id}: ${
      a?.text || "(no answer provided)"
    }`;
  });

  const prompt = `You are evaluating an entry-level candidate interviewing for a ${config.jobTitle} role.

Job description: ${config.jobDescription}

Candidate's interview transcript:
${qa.join("\n\n")}

Evaluation guidelines:
- This is an entry-level candidate — calibrate scoring expectations accordingly; do not penalise for lack of industry experience
- Score each answer from 1-10 where:
    * 1-3: Answer is missing, off-topic, or shows critical misunderstanding
    * 4-6: Partial answer with some relevant points but lacks structure or depth
    * 7-8: Clear, structured answer that demonstrates relevant thinking or experience
    * 9-10: Exceptional answer — specific, well-structured, shows strong self-awareness or insight
- For "strengths": highlight what the candidate did well, even if modest (e.g. clear communication, relevant example, honest self-reflection)
- For "improvements": give one or two concrete, actionable tips the candidate can apply immediately (e.g. "Try structuring your answer using STAR: Situation, Task, Action, Result" or "Add a specific outcome or metric to strengthen this example")
- If no answer was provided, set score to 0 and suggest how they might approach the question next time
- "overallSummary": write 2-3 encouraging but honest sentences summarising the candidate's overall performance, highlighting their strongest moment and one priority area to work on before their next interview

Return ONLY this JSON shape — no explanation, no markdown:
{
  "feedback": [
    {
      "questionId": number,
      "score": number,
      "strengths": "string",
      "improvements": "string"
    }
  ],
  "overallSummary": "string"
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

      const transcription = await getOpenAI().audio.transcriptions.create({
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

      const mp3 = await getOpenAI().audio.speech.create({
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
