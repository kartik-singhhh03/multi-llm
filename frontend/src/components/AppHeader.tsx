import { APP_NAME, APP_TAGLINE } from "../lib/constants";
import { BackendStatus } from "./BackendStatus";
import type { BackendConnectionStatus } from "../hooks/useBackendHealth";

type AppHeaderProps = {
  backendStatus: BackendConnectionStatus;
};

export function AppHeader({ backendStatus }: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-4 sm:items-center sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            IIT Patna AI/ML
          </p>
          <h1 className="mt-0.5 text-lg font-semibold text-zinc-50 sm:text-xl">
            {APP_NAME}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400">{APP_TAGLINE}</p>
        </div>
        <BackendStatus status={backendStatus} />
      </div>
    </header>
  );
}
