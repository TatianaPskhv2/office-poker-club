import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SESSION_COOKIE } from "@/lib/constants";

const DATA_DIR = path.join(process.env.DATA_DIR || process.cwd(), "data");
const SECRET_FILE = path.join(DATA_DIR, "session-secret.txt");

async function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try {
    return (await readFile(SECRET_FILE, "utf8")).trim();
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    const secret = randomBytes(32).toString("hex");
    await writeFile(SECRET_FILE, secret, "utf8");
    return secret;
  }
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export async function signSession(userId: string) {
  const secret = await getSecret();
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export async function readSessionUserId(token: string | undefined) {
  if (!token) return null;
  const [userId, exp, sig] = token.split(".");
  if (!userId || !exp || !sig) return null;
  if (Number(exp) < Date.now()) return null;
  const secret = await getSecret();
  const expected = createHmac("sha256", secret).update(`${userId}.${exp}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

export async function setSessionCookie(userId: string) {
  const token = await signSession(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const jar = await cookies();
  return readSessionUserId(jar.get(SESSION_COOKIE)?.value);
}
