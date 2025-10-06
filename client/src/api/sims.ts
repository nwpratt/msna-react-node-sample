// client/src/api/sims.ts
import type { SimConfig } from "../lib/simSchema";

const base = "/api/sims";

export async function listSims() {
  const r = await fetch(base);
  if (!r.ok) throw new Error("list failed");
  return (await r.json()) as { files: { name: string; size: number; mtime: string }[] };
}

export async function getSim(name: string) {
  const r = await fetch(`${base}/${encodeURIComponent(name)}`);
  if (!r.ok) throw new Error("get failed");
  return (await r.json()) as SimConfig;
}

export async function saveSim(name: string, json: SimConfig) {
  const r = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, json })
  });
  if (!r.ok) throw new Error("save failed");
  return await r.json();
}
