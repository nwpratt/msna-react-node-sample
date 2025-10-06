import simsRouter from './routes/sims';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 5001;

app.use('/api/sims', express.json(), simsRouter);

// --- middleware
app.use(morgan('dev'));
app.use(cors());
// make sure this is BEFORE your routes:
app.use(express.json({ limit: '10mb' }));   // <-- parse JSON bodies
app.use("/api/sims", simsRouter);

// --- where to put saved sims (inside the server folder)
const SIM_DIR = path.resolve(process.cwd(), 'server', 'simulations');

// create dir once on startup
async function ensureSimDir() {
  await fs.mkdir(SIM_DIR, { recursive: true });
  console.log('[sim] save directory:', SIM_DIR);
}
ensureSimDir().catch(console.error);

// ---- helpers
function safeName(name: string) {
  return (name || 'simulation')
    .replace(/[^a-z0-9-_ ]/gi, '_')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

// --- save a simulation file
app.post('/api/sim/save', async (req, res) => {
  try {
    const { name, data } = req.body || {};
    if (!name || !data) {
      return res.status(400).json({ error: 'name and data are required' });
    }
    const file = safeName(name) + '.json';
    const filePath = path.join(SIM_DIR, file);

    // double‑check we don’t escape the folder
    if (!filePath.startsWith(SIM_DIR)) {
      return res.status(400).json({ error: 'invalid path' });
    }

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return res.json({ ok: true, file, path: `/api/sim/file/${encodeURIComponent(file)}` });
  } catch (err: any) {
    console.error('[sim] save error:', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

// --- list saved simulations
app.get('/api/sim/list', async (_req, res) => {
  try {
    const files = await fs.readdir(SIM_DIR);
    const sims = files.filter(f => f.toLowerCase().endsWith('.json'));
    return res.json(sims);
  } catch (err: any) {
    console.error('[sim] list error:', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

// --- read a specific simulation
app.get('/api/sim/file/:file', async (req, res) => {
  try {
    const raw = req.params.file || '';
    const file = safeName(raw.replace(/\.json$/i, '')) + '.json';
    const filePath = path.join(SIM_DIR, file);
    if (!filePath.startsWith(SIM_DIR)) return res.status(400).end();
    return res.sendFile(filePath);
  } catch (err: any) {
    console.error('[sim] read error:', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
