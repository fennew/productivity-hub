import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript required" }, { status: 400 });
    }

    const result = await chatCompletion(
      [
        {
          role: "system",
          content: `You are a productivity assistant that processes voice notes. Given a transcript, you must:
1. Provide a concise summary (1-2 sentences)
2. Extract any actionable tasks mentioned

Respond in JSON format:
{
  "summary": "brief summary of the note",
  "tasks": ["task 1", "task 2"]
}

If no tasks are found, return an empty array. Only extract clear, actionable tasks.`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      "meta-llama/llama-3.1-8b-instruct:free",
      { temperature: 0.3 }
    );

    const content = result.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      // If JSON parsing fails, return the raw content as summary
    }

    return NextResponse.json({
      summary: content,
      tasks: [],
    });
  } catch (error) {
    console.error("Voice processing error:", error);
    return NextResponse.json(
      { error: "Failed to process voice note" },
      { status: 500 }
    );
  }
}
