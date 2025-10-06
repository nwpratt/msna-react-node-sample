import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sanitize from 'sanitize-filename';

const router = express.Router();

// Put your sim files under server/data/sims
const simsDir = path.resolve(process.cwd(), 'server', 'data', 'sims');
await fs.mkdir(simsDir, { recursive: true });

const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/sims/list
 * -> { files: ["*.json", ...] }
 */
router.get('/list', async (_req, res) => {
  const all = await fs.readdir(simsDir).catch(() => []);
  const files = all.filter(f => f.toLowerCase().endsWith('.json')).sort();
  res.json({ files });
});

/**
 * POST /api/sims/upload   (multipart/form-data)
 * field "file" (binary) and optional "name"
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'no file' });
    const nameRaw = (req.body?.name as string) || req.file.originalname || 'sim.json';
    const safe = sanitize(nameRaw.replace(/\s+/g, '-')) || 'sim.json';
    await fs.writeFile(path.join(simsDir, safe), req.file.buffer);
    res.json({ ok: true, name: safe });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: String(err?.message || err) });
  }
});

/**
 * GET /api/sims/get/:name
 * -> returns JSON file bytes
 */
router.get('/get/:name', async (req, res) => {
  try {
    const safe = sanitize(req.params.name);
    const full = path.join(simsDir, safe);
    const json = await fs.readFile(full, 'utf8');
    res.type('application/json').send(json);
  } catch {
    res.status(404).json({ message: 'not found' });
  }
});

export default router;
