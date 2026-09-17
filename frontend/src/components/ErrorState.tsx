import { btnSecondary } from "../lib/ui";

type ErrorStateProps = {
  message: string;
  onDismiss?: () => void;
};

export function ErrorState({ message, onDismiss }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200"
    >
      <p>{message}</p>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className={`${btnSecondary} shrink-0 px-2 py-1 text-xs`}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
