import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: ORIGIN }));
app.use(express.json());

// --- Mock data (MS&A / logistics flavor) ---
let simulations = [
  { id: "sim-" + nanoid(6), createdAt: Date.now() - 86400000*3, params: { demandShift: -0.1, disruptionProb: 0.05 }, status: "complete", metrics: { onTimeRate: 0.92, avgDelayHrs: 3.4 } },
  { id: "sim-" + nanoid(6), createdAt: Date.now() - 86400000*1, params: { demandShift: 0.15, disruptionProb: 0.2 }, status: "complete", metrics: { onTimeRate: 0.86, avgDelayHrs: 5.8 } }
];

const dailySeries = Array.from({ length: 14 }).map((_, i) => {
  const day = new Date(Date.now() - (13 - i)*86400000);
  const base = 80 + Math.round(Math.random()*15);
  const disruptions = Math.round(base * (0.05 + Math.random()*0.2));
  const onTime = Math.max(0, base - disruptions);
  return { date: day.toISOString().slice(0,10), onTime, disruptions, total: base };
});

// --- Routes ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, serverTime: new Date().toISOString() });
});

app.get("/api/metrics", (req, res) => {
  // Simple aggregate for the chart
  const sum = dailySeries.reduce((acc, d) => {
    acc.onTime += d.onTime; acc.disruptions += d.disruptions; acc.total += d.total;
    return acc;
  }, { onTime: 0, disruptions: 0, total: 0 });
  res.json({ series: dailySeries, totals: sum });
});

app.get("/api/simulations", (req, res) => {
  res.json(simulations.sort((a,b) => b.createdAt - a.createdAt));
});

app.post("/api/simulations", (req, res) => {
  const { demandShift = 0, disruptionProb = 0.1 } = req.body || {};
  const id = "sim-" + nanoid(6);
  // Mock a simple "result" calculation
  const onTimeRate = Math.max(0, Math.min(1, 0.9 - (disruptionProb*0.4) + (demandShift*0.1)));
  const avgDelayHrs = Math.max(0, 4 + (disruptionProb*8) - (demandShift*2));
  const sim = { id, createdAt: Date.now(), params: { demandShift, disruptionProb }, status: "complete", metrics: { onTimeRate, avgDelayHrs } };
  simulations.push(sim);
  res.status(201).json(sim);
});

app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (CORS origin ${ORIGIN})`);
});
