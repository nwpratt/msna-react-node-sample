import React from 'react'
import { useEffect, useState } from 'react'
import { getMetrics, getHealth } from '../api'
import Chart, { Series, CommonSeriesSettings, ArgumentAxis, Legend, Tooltip } from 'devextreme-react/chart'

export default function Dashboard() {
  const [series, setSeries] = useState([])
  const [totals, setTotals] = useState({ onTime: 0, disruptions: 0, total: 0 })
  const [health, setHealth] = useState(null)

  useEffect(() => {
    (async () => {
      const h = await getHealth()
      setHealth(h)
      const m = await getMetrics()
      setSeries(m.series || [])
      setTotals(m.totals || { onTime: 0, disruptions: 0, total: 0 })
    })()
  }, [])

  return (
    <div className="grid">
      <div className="card">
        <h3>Daily Throughput — On‑time vs Disruptions (last 14 days)</h3>
        <Chart dataSource={series} id="chart">
          <CommonSeriesSettings argumentField="date" type="bar" />
          <Series valueField="onTime" name="On‑time" />
          <Series valueField="disruptions" name="Disruptions" />
          <ArgumentAxis argumentType="string" tickInterval={2} />
          <Legend verticalAlignment="top" horizontalAlignment="right" />
          <Tooltip enabled={true} customizeTooltip={(arg) => ({ text: `${arg.seriesName}: ${arg.value}` })} />
        </Chart>
      </div>

      <div className="card">
        <h3>Summary</h3>
        <p>Total moves: <strong>{totals.total}</strong></p>
        <p>On‑time: <strong>{totals.onTime}</strong></p>
        <p>Disruptions: <strong>{totals.disruptions}</strong></p>
        {health && <p className="badge">API OK @ {new Date(health.serverTime).toLocaleString()}</p>}
      </div>
    </div>
  )
}
