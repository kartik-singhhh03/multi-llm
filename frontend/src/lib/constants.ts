export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const APP_NAME = "Multi-LLM Custom ChatGPT";

export const APP_TAGLINE =
  "Compare OpenAI, Claude, and Gemini side-by-side.";

export const MAX_PROMPT_LENGTH = 8000;

export const PROVIDER_ORDER = ["openai", "claude", "gemini"] as const;

export const PROVIDER_LABELS = {
  openai: "OpenAI",
  claude: "Claude",
  gemini: "Gemini",
} as const;

export const EXAMPLE_PROMPTS = [
  "Explain recursion to a beginner",
  "What is REST vs GraphQL?",
  "Explain process vs thread",
] as const;
