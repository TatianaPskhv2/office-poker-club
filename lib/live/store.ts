import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CreateLiveInput, LiveSession } from "@/types";
import {
  bustPlayer,
  closeTable,
  createLiveSession,
  recordHand,
  setStack,
} from "@/lib/live/logic";

const DIR = path.join(process.cwd(), "data", "live");
const locks = new Map<string, Promise<unknown>>();

function filePath(id: string) {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) throw new Error("Invalid live table id");
  return path.join(DIR, `${safe}.json`);
}

async function withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(id) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  locks.set(
    id,
    previous.then(() => gate)
  );
  await previous.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
  }
}

async function readSession(id: string): Promise<LiveSession | null> {
  try {
    const raw = await readFile(filePath(id), "utf8");
    return JSON.parse(raw) as LiveSession;
  } catch {
    return null;
  }
}

async function writeSession(session: LiveSession) {
  await mkdir(DIR, { recursive: true });
  await writeFile(filePath(session.id), JSON.stringify(session, null, 2), "utf8");
}

export async function getLiveSession(id: string) {
  return readSession(id);
}

export async function deleteLiveSession(id: string) {
  return withLock(id, async () => {
    try {
      await unlink(filePath(id));
    } catch {
      // already gone
    }
    return true;
  });
}

export async function startLiveSession(input: CreateLiveInput) {
  return withLock(input.id, async () => {
    const existing = await readSession(input.id);
    if (existing) return existing;
    if (input.players.length < 2) {
      throw new Error("Need at least two players");
    }
    const session = createLiveSession(input);
    await writeSession(session);
    return session;
  });
}

export async function applyLiveAction(
  id: string,
  body: {
    type: "hand" | "bust" | "stack" | "close";
    playerId?: string;
    pot?: number;
    stack?: number;
  }
) {
  return withLock(id, async () => {
    const current = await readSession(id);
    if (!current) return null;
    const session = structuredClone(current);
    let next = session;
    if (body.type === "hand" && body.playerId) {
      next = recordHand(session, body.playerId, body.pot ?? 0);
    } else if (body.type === "bust" && body.playerId) {
      next = bustPlayer(session, body.playerId);
    } else if (body.type === "stack" && body.playerId !== undefined) {
      next = setStack(session, body.playerId, Number(body.stack ?? 0));
    } else if (body.type === "close") {
      next = closeTable(session);
    }
    await writeSession(next);
    return next;
  });
}
