import { APP_NAME, APP_TAGLINE } from "../lib/constants";
import { BackendStatus } from "./BackendStatus";
import type { BackendConnectionStatus } from "../hooks/useBackendHealth";

type AppHeaderProps = {
  backendStatus: BackendConnectionStatus;
};

export function AppHeader({ backendStatus }: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            IIT Patna AI/ML Program
          </p>
          <h1 className="text-xl font-semibold text-zinc-50 sm:text-2xl">
            {APP_NAME}
          </h1>
          <p className="text-sm text-zinc-400">{APP_TAGLINE}</p>
        </div>
        <BackendStatus status={backendStatus} />
      </div>
    </header>
  );
}
