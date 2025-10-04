import React from 'react'

export default function About() {
  return (
    <div className="card">
      <h3>About this demo</h3>
      <p>
        This is a small portfolio sample showing a <strong>React</strong> front‑end with <strong>DevExtreme charts</strong> and a
        <strong> Node/Express</strong> API. It mirrors patterns used in mission‑support MS&A apps:
        simple simulation parameters, a results table, and a daily throughput chart.
      </p>
      <ul>
        <li>React + React Router</li>
        <li>DevExtreme React chart (bar) with dx.light theme</li>
        <li>Express API with CORS, sample endpoints, and mock simulation logic</li>
      </ul>
      <p>
        Configure <code>VITE_API_URL</code> in <code>client/.env</code> if your API runs elsewhere. Default is <code>http://localhost:4000</code>.
      </p>
    </div>
  )
}
