# MS&A Demo (React + Cesium + Node + DevExtreme)

## Prereqs
- Node 20+ and npm 10+
- A Cesium ion token

## First run (from repo root)
npm --prefix server ci && npm --prefix client ci

# Put your token in client/.env
# VITE_CESIUM_ION_TOKEN=your_token_here

## Start both apps
npm run dev

# Expect:
# - Express API on http://localhost:5001
# - Vite client on http://localhost:5173

## Troubleshooting
- If you see 404 `/api/sims` the server isn’t running; start from repo root.
- If “concurrently is not recognized”, run: `npm i -D concurrently cross-env` in the root or the script’s package.
- If Cesium CSS is missing, ensure `import "cesium/Build/CesiumUnminified/Widgets/widgets.css";`
  (or version-safe equivalent) is in the page that mounts the Viewer.


## Production build (single-server deploy)

1. Build the client (Vite) bundle:

```bash
npm --prefix client run build
```

2. Start the API server (it will serve the static client from `client/dist`):

```bash
npm --prefix server run start
# or: NODE_ENV=production node server/src/server.js
```

By default the server listens on `http://localhost:5001` and will serve the SPA at `/`.
All non-`/api/*` routes fall back to `index.html`.

### Optional: one-liner from the repo root

```bash
npm run build:prod && npm run start:prod
```

Add these scripts to your root `package.json` if you want the shortcut:

```json
{
  "scripts": {
    "build:prod": "npm --prefix client run build",
    "start:prod": "cross-env NODE_ENV=production npm --prefix server run start"
  }
}
```

## Self-healing bootstrap (Windows/macOS/Linux)

From the repo root:

```bash
npm run setup
npm run dev
```

The `setup` script:
- Ensures `client/.env` exists (adds a placeholder if missing)
- Installs server and client dependencies with the correct working directories
- Prints next steps

> Tip: If corporate proxies or strict networks cause install hiccups, you can fall back to:
>
> ```bash
> npm run install:all:legacy
> ```
