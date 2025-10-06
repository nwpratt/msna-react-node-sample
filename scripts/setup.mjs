
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

function sh(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(cmd + ' exited ' + code)));
  });
}

const root = process.cwd();
const clientEnv = join(root, 'client', '.env');
if (!existsSync(clientEnv)) {
  writeFileSync(clientEnv, 'VITE_CESIUM_ION_TOKEN=\n#VITE_DEVEXTREME_LICENSE=\n', 'utf8');
  console.log('[setup] Created client/.env placeholder — set your VITE_CESIUM_ION_TOKEN.');
}

console.log('[setup] Installing server deps...');
await sh('npm', ['install'], join(root, 'server'));

console.log('[setup] Installing client deps...');
await sh('npm', ['install'], join(root, 'client'));

console.log('[setup] Done. Next: npm run dev');


// Basic Node version check (>= 20.x)
const [major] = process.versions.node.split('.').map(Number);
if (!major || major < 20) {
  console.warn(`[setup] Warning: Node ${process.versions.node} detected. Please use Node 20+.`);
}
