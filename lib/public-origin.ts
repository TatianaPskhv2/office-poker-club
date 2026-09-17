import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const FILE = path.join(process.cwd(), "data", "public-origin.txt");

export function isLocalHostHeader(host: string) {
  const hostname = host.split(":")[0]?.trim().toLowerCase() ?? "";
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

export function originFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-host");
  const host = (forwarded ?? request.headers.get("host") ?? "").split(",")[0]?.trim();
  if (!host || isLocalHostHeader(host)) return null;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`.replace(/\/$/, "");
}

export async function readStoredPublicOrigin(): Promise<string | null> {
  const fromEnv = process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  try {
    const raw = (await readFile(FILE, "utf8")).trim().replace(/\/$/, "");
    return raw || null;
  } catch {
    return null;
  }
}

export async function rememberPublicOrigin(origin: string) {
  try {
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, `${origin}\n`, "utf8");
  } catch {
    // ignore
  }
}

export async function resolvePublicOrigin(request: Request): Promise<string | null> {
  const fromRequest = originFromRequest(request);
  if (fromRequest) {
    const stored = await readStoredPublicOrigin();
    if (stored !== fromRequest) await rememberPublicOrigin(fromRequest);
    return fromRequest;
  }
  return readStoredPublicOrigin();
}
