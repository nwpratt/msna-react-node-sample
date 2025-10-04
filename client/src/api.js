const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function getHealth() {
  const r = await fetch(`${BASE}/api/health`);
  return r.json();
}

export async function getMetrics() {
  const r = await fetch(`${BASE}/api/metrics`);
  return r.json();
}

export async function listSimulations() {
  const r = await fetch(`${BASE}/api/simulations`);
  return r.json();
}

export async function runSimulation(params) {
  const r = await fetch(`${BASE}/api/simulations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {})
  });
  return r.json();
}
