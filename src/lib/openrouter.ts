const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface ChatCompletionMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function chatCompletion(
  messages: ChatCompletionMessage[],
  model: string = "meta-llama/llama-3.1-8b-instruct:free",
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

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  return response.json();
}

export async function streamChatCompletion(
  messages: ChatCompletionMessage[],
  model: string = "meta-llama/llama-3.1-8b-instruct:free"
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

// Available cheap/free models on OpenRouter
export const AVAILABLE_MODELS = [
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Free)", free: true },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B (Free)", free: true },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B (Free)", free: true },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", free: false },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", free: false },
  { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5", free: false },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", free: false },
] as const;
