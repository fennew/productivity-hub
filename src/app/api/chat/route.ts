import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const result = await chatCompletion(messages, model);

    // Handle case where the API returns an error object
    if (result.error) {
      console.error("OpenRouter error:", result.error);
      return NextResponse.json({
        choices: [
          {
            message: {
              content: `API Error: ${result.error.message || JSON.stringify(result.error)}. Try selecting a different model.`,
            },
          },
        ],
      });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      choices: [
        {
          message: {
            content: `Server error: ${message}. Check your OpenRouter API key in .env.local.`,
          },
        },
      ],
    });
  }
}
