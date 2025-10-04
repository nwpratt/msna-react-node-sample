# MS&A Logistics Demo — React + DevExtreme + Node/Express

> Portfolio demo: React (Vite) + DevExtreme charts with a Node/Express API for MS&A/decision‑support patterns—simulation runs, metrics, and dashboards.

A small, portfolio‑ready sample that mirrors patterns from mission‑support MS&A apps:
- **React** front‑end with **DevExtreme** charts
- **Express** API with simple MS&A‑style endpoints
- Ready to run locally or deploy, and easy to put on GitHub

## Structure
```
msna-react-node-sample/
  ├─ client/        # React (Vite), DevExtreme charts, Router
  └─ server/        # Express API (CORS enabled)
```

## Quick start

### 1) API
```bash
cd server
cp .env.sample .env   # optional
npm install
npm run dev           # or: npm start
# Server on http://localhost:4000
```

### 2) Client
```bash
cd client
cp .env.sample .env   # defaults to http://localhost:4000
npm install
npm run dev           # Vite on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Deploy (optional)
- **Client**: Vercel, Netlify, or GitHub Pages (build: `npm run build`).
- **Server**: Render, Fly.io, Railway, or any Node host (run: `npm start`).  
  Update `VITE_API_URL` in the client environment when deploying separately.

## Topics
`react` · `vite` · `devextreme` · `devexpress` · `charts` · `data-visualization` · `express` · `nodejs` · `ms-a` · `simulation` · `decision-support` · `logistics` · `portfolio`

## Notes
- Chart theme comes from `devextreme/dist/css/dx.light.css` (imported in `client/src/main.jsx`).
- The API simulates basic metrics and a "run simulation" endpoint for demo purposes only.

## Third‑party notices
This repository’s source code is licensed under the MIT license (see **LICENSE**).

It depends on third‑party packages with their own licenses:
- React — MIT License
- Express — MIT License
- DevExtreme (**DevExpress**) — commercial / per‑developer license. If you build or distribute this project with DevExtreme, you must comply with DevExpress’s EULA and licensing terms.
