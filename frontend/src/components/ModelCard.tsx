import { PROVIDER_LABELS } from "../lib/constants";
import { formatLatency } from "../lib/format";
import { btnSecondary } from "../lib/ui";
import type { ComparisonResult, ProviderName } from "../types/chat";
import { CopyButton } from "./CopyButton";
import { MarkdownContent } from "./MarkdownContent";
import { ProviderBadge } from "./ProviderBadge";

type ModelCardProps = {
  result?: ComparisonResult;
  provider: ProviderName;
  loading?: boolean;
  continueDisabled?: boolean;
  onContinue?: (provider: ProviderName) => void;
};

const ACCENT: Record<ProviderName, string> = {
  openai: "border-emerald-900/80",
  claude: "border-amber-900/80",
  gemini: "border-sky-900/80",
};

export function ModelCard({
  result,
  provider,
  loading = false,
  continueDisabled = false,
  onContinue,
}: ModelCardProps) {
  const label = PROVIDER_LABELS[provider];

  return (
    <article
      className={`flex min-h-80 min-w-0 flex-col rounded-xl border bg-zinc-900 ${ACCENT[provider]}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProviderBadge provider={provider} />
          <div className="min-w-0">
            <h3 className="font-medium text-zinc-50">{label}</h3>
            <p className="truncate text-xs text-zinc-500">
              {loading ? "Waiting for model" : result?.model || "Unknown model"}
            </p>
          </div>
        </div>
        {result?.status === "success" && result.content ? (
          <CopyButton text={result.content} />
        ) : null}
      </header>

      <div className="min-h-40 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 lg:max-h-80">
        {loading ? (
          <div className="space-y-2" aria-live="polite">
            <p className="text-sm text-zinc-400">Generating...</p>
            <div className="h-3 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
          </div>
        ) : result?.status === "success" && result.content ? (
          <MarkdownContent text={result.content} />
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-200">
              {isConfigError(result?.error)
                ? "Not available / Configuration required"
                : "Unable to generate a response"}
            </p>
            <p className="text-sm text-zinc-500">
              {friendlyProviderError(label, result?.error)}
            </p>
          </div>
        )}
      </div>

      <footer className="mt-auto space-y-3 border-t border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <StatusLabel loading={loading} status={result?.status} />
          <span className="text-zinc-500">
            {loading || !result ? "—" : formatLatency(result.latency_ms)}
          </span>
        </div>
        {onContinue ? (
          <button
            type="button"
            disabled={continueDisabled || loading}
            onClick={() => onContinue(provider)}
            className={`${btnSecondary} w-full`}
          >
            Continue with {label}
          </button>
        ) : null}
      </footer>
    </article>
  );
}

function StatusLabel({
  loading,
  status,
}: {
  loading: boolean;
  status?: "success" | "error";
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Generating
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-rose-300">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        Error
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Success
      </span>
    );
  }
  return <span className="text-zinc-500">—</span>;
}

function isConfigError(error: string | null | undefined): boolean {
  return Boolean(error?.toLowerCase().includes("api key is not configured"));
}

function friendlyProviderError(
  label: string,
  error: string | null | undefined,
): string {
  if (!error) {
    return `${label} could not generate a response.`;
  }
  if (error.toLowerCase().includes("api key is not configured")) {
    return `${label} is not configured on the backend.`;
  }
  if (error.toLowerCase().includes("timed out")) {
    return `${label} timed out.`;
  }
  return `${label} could not generate a response.`;
}
