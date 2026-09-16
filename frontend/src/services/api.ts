import { API_BASE_URL } from "../lib/constants";
import type { HealthResponse } from "../types/health";

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  const data = (await response.json()) as HealthResponse;

  if (!data || typeof data.status !== "string") {
    throw new Error("Health check returned an invalid response");
  }

  return data;
}
