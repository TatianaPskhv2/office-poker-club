export function isLocalHostname(hostname: string) {
  const host = hostname.replace(/:\d+$/, "").toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local")
  );
}

export async function getShareOrigin(): Promise<{ origin: string; public: boolean }> {
  const current = window.location.origin;
  if (!isLocalHostname(window.location.hostname)) {
    return { origin: current, public: true };
  }
  try {
    const response = await fetch("/api/public-origin", { cache: "no-store" });
    const data = (await response.json()) as { origin?: string | null };
    if (data.origin) {
      const host = new URL(data.origin).hostname;
      if (!isLocalHostname(host)) {
        return { origin: data.origin.replace(/\/$/, ""), public: true };
      }
    }
  } catch {
    // нет публичного адреса — остаётся localhost
  }
  return { origin: current, public: false };
}

export async function liveShareUrl(id: string) {
  const share = await getShareOrigin();
  return { url: `${share.origin}/live/${id}`, public: share.public };
}
