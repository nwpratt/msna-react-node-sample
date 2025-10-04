import React, { useEffect, useState } from 'react'
import { listSimulations, runSimulation } from '../api'

export default function Simulations() {
  const [rows, setRows] = useState([])
  const [demandShift, setDemandShift] = useState(0.1)
  const [disruptionProb, setDisruptionProb] = useState(0.1)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const data = await listSimulations()
    setRows(data || [])
  }

  useEffect(() => { refresh() }, [])

  async function submit() {
    setBusy(true)
    try {
      await runSimulation({ demandShift: parseFloat(demandShift), disruptionProb: parseFloat(disruptionProb) })
    } finally {
      setBusy(false)
      refresh()
    }
  }

  return (
    <div className="card">
      <h3>Simulations</h3>

      <div className="form-row">
        <div>
          <label>Demand shift (‑1..+1)</label>
          <input type="number" step="0.05" min="-1" max="1" value={demandShift} onChange={e => setDemandShift(e.target.value)} />
        </div>
        <div>
          <label>Disruption probability (0..1)</label>
          <input type="number" step="0.05" min="0" max="1" value={disruptionProb} onChange={e => setDisruptionProb(e.target.value)} />
        </div>
        <button onClick={submit} disabled={busy}>Run Simulation</button>
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>ID</th><th>Created</th><th>Demand Shift</th><th>Disruption Prob</th><th>On‑time Rate</th><th>Avg Delay (hrs)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
              <td>{r.params.demandShift}</td>
              <td>{r.params.disruptionProb}</td>
              <td>{(r.metrics.onTimeRate*100).toFixed(1)}%</td>
              <td>{r.metrics.avgDelayHrs.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
