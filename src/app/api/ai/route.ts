async function callOpenAI(prompt: string, system: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, 
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  console.log("OpenAI response:", data);

  return data.choices?.[0]?.message?.content ?? "";
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
    return `Q${q.id}: ${q.text}\nA${q.id}: ${a?.text || "(no answer provided)"}`;
  });

  const prompt = `You interviewed a candidate for ${config.jobTitle}.
Job description: ${config.jobDescription}

${qa.join("\n\n")}

Return JSON with shape:
{
  "feedback": [
    {"questionId": number, "score": number (1-10), "strengths": "string", "improvements": "string"}
  ],
  "overallSummary": "2-3 sentence overall assessment"
}`;

  const raw = await callOpenAI(prompt, system);
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  try {
    if (action === "generateQuestions") {
      const result = await generateQuestions(body.config);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "evaluateAnswers") {
      const result = await evaluateAnswers(body.config, body.questions, body.answers);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}