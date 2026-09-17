import { PROVIDER_LABELS } from "../lib/constants";
import { formatLatency } from "../lib/format";
import { btnSecondary } from "../lib/ui";
import type { ConversationTurn, ProviderName } from "../types/chat";
import { CopyButton } from "./CopyButton";
import { MarkdownContent } from "./MarkdownContent";
import { PromptInput } from "./PromptInput";
import { ProviderBadge } from "./ProviderBadge";

type ContinuePanelProps = {
  provider: ProviderName;
  turns: ConversationTurn[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onNewComparison: () => void;
  disabled: boolean;
  generating?: boolean;
};

export function ContinuePanel({
  provider,
  turns,
  prompt,
  onPromptChange,
  onSubmit,
  onBack,
  onNewComparison,
  disabled,
  generating = false,
}: ContinuePanelProps) {
  const label = PROVIDER_LABELS[provider];

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <ProviderBadge provider={provider} size="md" />
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            Continuing with {label}
          </h2>
          <p className="text-sm text-zinc-400">
            Your follow-up messages will be sent only to {label}.
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
        {turns.map((turn, index) => (
          <article
            key={`${turn.role}-${index}`}
            className={`rounded-lg border px-4 py-3 ${
              turn.role === "user"
                ? "border-zinc-800 bg-zinc-950"
                : "border-zinc-800 bg-zinc-950/60"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {turn.role === "user" ? "You" : label}
              </p>
              {turn.role === "assistant" && turn.content ? (
                <CopyButton text={turn.content} />
              ) : null}
            </div>
            {turn.role === "assistant" && turn.error ? (
              <p className="text-sm text-zinc-300">
                {label} could not generate a response.
              </p>
            ) : turn.role === "assistant" ? (
              <MarkdownContent text={turn.content} />
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                {turn.content}
              </p>
            )}
            {turn.role === "assistant" && turn.latencyMs != null && !turn.error ? (
              <p className="mt-2 text-xs text-zinc-500">
                {formatLatency(turn.latencyMs)}
              </p>
            ) : null}
          </article>
        ))}
        {generating ? (
          <div className="space-y-2 rounded-lg border border-zinc-800 px-4 py-3" role="status">
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              {label}
            </p>
            <p className="text-sm text-zinc-400">Generating...</p>
            <div className="h-3 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
          </div>
        ) : null}
      </div>

      <PromptInput
        value={prompt}
        onChange={onPromptChange}
        onSubmit={onSubmit}
        disabled={disabled}
        submitLabel="Send"
        placeholder={`Ask ${label} a follow-up...`}
        inputId="follow-up-input"
        label="Follow-up"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
        <button type="button" onClick={onBack} className={btnSecondary}>
          Back to results
        </button>
        <button type="button" onClick={onNewComparison} className={btnSecondary}>
          New Comparison
        </button>
      </div>
    </section>
  );
}
