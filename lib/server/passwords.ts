import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const FILE = path.join(process.env.DATA_DIR || process.cwd(), "data", "passwords.json");
const memory: Record<string, string> = {};

type PasswordMap = Record<string, string>;

async function readAll(): Promise<PasswordMap> {
  try {
    const fromDisk = JSON.parse(await readFile(FILE, "utf8")) as PasswordMap;
    Object.assign(memory, fromDisk);
  } catch {
    /* keep memory */
  }
  return { ...memory };
}

async function writeAll(map: PasswordMap) {
  Object.assign(memory, map);
  try {
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(map), "utf8");
  } catch {
    /* process memory still has the password */
  }
}

export async function getPasswordHash(userId: string) {
  if (memory[userId]) return memory[userId];
  const map = await readAll();
  return map[userId];
}

export async function setPasswordHash(userId: string, hash: string) {
  const map = await readAll();
  map[userId] = hash;
  await writeAll(map);
}
