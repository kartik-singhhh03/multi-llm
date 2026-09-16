import { useEffect, useState } from "react";

import { getHealth } from "../services/api";

export type BackendConnectionStatus =
  | "checking"
  | "connected"
  | "disconnected";

export function useBackendHealth(
  pollIntervalMs = 15000,
): BackendConnectionStatus {
  const [status, setStatus] = useState<BackendConnectionStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const result = await getHealth();
        if (!cancelled) {
          setStatus(result.status === "ok" ? "connected" : "disconnected");
        }
      } catch {
        if (!cancelled) {
          setStatus("disconnected");
        }
      }
    }

    void checkHealth();
    const intervalId = window.setInterval(() => {
      void checkHealth();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pollIntervalMs]);

  return status;
}
