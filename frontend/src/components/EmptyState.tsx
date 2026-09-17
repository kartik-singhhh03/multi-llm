import { EXAMPLE_PROMPTS } from "../lib/constants";
import { btnSecondary } from "../lib/ui";

type EmptyStateProps = {
  onChooseExample: (prompt: string) => void;
};

export function EmptyState({ onChooseExample }: EmptyStateProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-zinc-50">
          Ask once. Compare three AI responses.
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Submit one question to OpenAI, Claude, and Gemini. Then continue with
          the model you prefer.
        </p>
      </div>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onChooseExample(prompt)}
              className={`${btnSecondary} w-full justify-start px-3 py-1.5 text-left text-xs font-normal text-zinc-300 sm:w-auto`}
            >
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
