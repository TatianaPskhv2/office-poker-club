export function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function stamp() {
  return new Date().toISOString();
}

export function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function nameKey(name: string) {
  return normalizeName(name).split(" ").filter(Boolean).sort().join(" ");
}
