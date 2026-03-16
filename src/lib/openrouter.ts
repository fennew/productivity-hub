const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface ChatCompletionMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function chatCompletion(
  messages: ChatCompletionMessage[],
  model: string = "openai/gpt-4o-mini",
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Productivity Hub",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1024,
    }),
  });

  // Return the JSON even on error so we can surface the error message
  const data = await response.json();
  return data;
}

export async function streamChatCompletion(
  messages: ChatCompletionMessage[],
  model: string = "openai/gpt-4o-mini"
) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Productivity Hub",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  return response;
}

// Available models on OpenRouter (updated March 2026)
export const AVAILABLE_MODELS = [
  { id: "openai/gpt-4o-mini", name: "Gemini 2.0 Flash (Free)", free: true },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (Free)", free: true },
  { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B (Free)", free: true },
  { id: "deepseek/deepseek-chat:free", name: "DeepSeek V3 (Free)", free: true },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", free: false },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", free: false },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", free: false },
] as const;
