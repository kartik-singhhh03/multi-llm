import type { BackendConnectionStatus } from "../hooks/useBackendHealth";

type BackendStatusProps = {
  status: BackendConnectionStatus;
};

const STATUS_LABEL: Record<BackendConnectionStatus, string> = {
  checking: "Checking",
  connected: "Connected",
  disconnected: "Disconnected",
};

const STATUS_DOT: Record<BackendConnectionStatus, string> = {
  checking: "bg-amber-400",
  connected: "bg-emerald-400",
  disconnected: "bg-rose-400",
};

export function BackendStatus({ status }: BackendStatusProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
      <span
        className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`}
        aria-hidden="true"
      />
      <span className="text-zinc-400">Backend Status:</span>
      <span className="font-medium text-zinc-100">{STATUS_LABEL[status]}</span>
    </div>
  );
}
