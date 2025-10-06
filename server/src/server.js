
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSampleRoutes } from './openflights.js';
import simsRouter from './routes/sims.ts';

dotenv.config();
const app = express();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Serve the built client (Vite) in production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: let the client handle routing
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(cors());
app.use(express.json());
app.use('/api/sims', simsRouter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.get('/api/openflights/routes', async (req, res) => {
  try {
    const limit = Math.min(1000, parseInt(req.query.limit || '300', 10) || 300);
    const data = await getSampleRoutes(limit);
    res.json({ routes: data.length, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`[server] http://localhost:${port}`));
