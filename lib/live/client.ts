import type { CreateLiveInput, LiveSession } from "@/types";

async function parse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { session?: T; error?: string };
  if (!response.ok || !payload.session) {
    throw new Error(payload.error || "Не удалось обновить стол");
  }
  return payload.session;
}

export async function fetchLiveSession(id: string): Promise<LiveSession | null> {
  const response = await fetch(`/api/live/${id}`, { cache: "no-store" });
  if (response.status === 404) return null;
  return parse<LiveSession>(response);
}

export async function startLiveSession(input: CreateLiveInput): Promise<LiveSession> {
  const response = await fetch("/api/live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse<LiveSession>(response);
}

export async function postLiveAction(
  id: string,
  body: {
    type: "hand" | "bust" | "stack" | "close";
    playerId?: string;
    pot?: number;
    stack?: number;
  }
): Promise<LiveSession> {
  const response = await fetch(`/api/live/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<LiveSession>(response);
}

export async function abortLiveSession(id: string) {
  const response = await fetch(`/api/live/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error("Не удалось отменить стол");
  }
}
