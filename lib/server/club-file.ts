import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeedState, recomputeClubState } from "@/lib/data/seed";
import { migrateState } from "@/lib/data/migrate";
import type { ClubState, User } from "@/types";

const FILE = path.join(process.env.DATA_DIR || process.cwd(), "data", "club-state.json");
let chain: Promise<unknown> = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function readState(): Promise<ClubState> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as ClubState;
    const next = recomputeClubState(migrateState({ ...createSeedState(), ...parsed }));
    const dropped =
      (parsed.players?.length ?? 0) !== next.players.length ||
      (parsed.users?.length ?? 0) !== next.users.length;
    if (dropped) await writeState(next);
    return next;
  } catch {
    const seed = createSeedState();
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(seed), "utf8");
    return seed;
  }
}

async function writeState(state: ClubState) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(state), "utf8");
}

export async function loadClub(): Promise<ClubState> {
  return withLock(readState);
}

export async function saveClub(state: ClubState): Promise<ClubState> {
  const next = recomputeClubState(migrateState(state));
  await withLock(async () => {
    await writeState(next);
  });
  return next;
}

export async function updateClub(
  mutator: (state: ClubState) => ClubState
): Promise<ClubState> {
  return withLock(async () => {
    const current = await readState();
    const next = recomputeClubState(mutator(structuredClone(current)));
    await writeState(next);
    return next;
  });
}

export function withActor(state: ClubState, user: User): ClubState {
  return { ...state, currentUserId: user.id };
}
