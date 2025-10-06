// client/src/pages/SimDesigner.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'devextreme/dist/css/dx.light.css';
import ResponsiveBox, { Row, Col, Item, Location } from 'devextreme-react/responsive-box';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import * as Cesium from 'cesium';
import { createViewer, flyToCONUS } from '../lib/cesiumUtils';
import { svgRotationFromHeading, DEFAULT_SVG_NOSE_OFFSET_DEG, initialBearingDeg } from '../lib/heading';

// --- Types shared with server (mirrors shared/sim-types.ts)
type Waypoint = { iata?: string; icao?: string; lat?: number; lon?: number; altFt?: number };
export type FlightPlan = {
  id: string;
  callsign: string;
  from: Waypoint;
  to: Waypoint;
  speedKts?: number;
  cruiseAltFt?: number;
  departOffsetMin?: number;
};
export type SimConfig = {
  id: string;
  name: string;
  startTimeUtc?: string;
  durationMin: number;
  loop?: boolean;
  flights: FlightPlan[];
};

// --- Minimal Zod-like runtime checks (no hard dependency)
function isFiniteNumber(n: unknown): n is number { return typeof n === 'number' && isFinite(n); }
function isNonEmptyString(s: unknown): s is string { return typeof s === 'string' && s.trim().length > 0; }
function validateSim(sim: SimConfig): { ok: true } | { ok: false; message: string } {
  if (!isNonEmptyString(sim.id)) return { ok: false, message: 'Sim id is required' };
  if (!isNonEmptyString(sim.name)) return { ok: false, message: 'Sim name is required' };
  if (!isFiniteNumber(sim.durationMin) || sim.durationMin <= 0) return { ok: false, message: 'Duration (min) must be > 0' };
  if (!Array.isArray(sim.flights) || sim.flights.length === 0) return { ok: false, message: 'Add at least one flight' };
  for (const [i, f] of sim.flights.entries()) {
    if (!isNonEmptyString(f.id)) return { ok: false, message: `Flight ${i + 1}: id is required` };
    if (!isNonEmptyString(f.callsign)) return { ok: false, message: `Flight ${i + 1}: callsign is required` };
    const fromOk = f.from && ((f.from.iata || f.from.icao) || (isFiniteNumber(f.from.lat) && isFiniteNumber(f.from.lon)));
    const toOk = f.to && ((f.to.iata || f.to.icao) || (isFiniteNumber(f.to.lat) && isFiniteNumber(f.to.lon)));
    if (!fromOk) return { ok: false, message: `Flight ${i + 1}: specify origin (IATA/ICAO or lat/lon)` };
    if (!toOk) return { ok: false, message: `Flight ${i + 1}: specify destination (IATA/ICAO or lat/lon)` };
  }
  return { ok: true };
}

// --- Airport lookup (from /public/data/openflights/airports-lite.json)
type AirportLite = { id: number; name?: string; iata?: string; icao?: string; country?: string; lat: number; lon: number };
async function loadAirports(): Promise<AirportLite[]> {
  try {
    const r = await fetch('/data/openflights/airports-lite.json', { cache: 'force-cache' });
    if (!r.ok) throw new Error('Failed to load airports-lite.json');
    const data = await r.json();
    return Array.isArray(data) ? data as AirportLite[] : [];
  } catch {
    return [];
  }
}
function indexAirports(rows: AirportLite[]) {
  const byIata = new Map<string, AirportLite>();
  const byIcao = new Map<string, AirportLite>();
  for (const a of rows) {
    if (a.iata) byIata.set(a.iata.toUpperCase(), a);
    if (a.icao) byIcao.set(a.icao.toUpperCase(), a);
  }
  return { byIata, byIcao };
}
function resolveWaypoint(w: Waypoint, airports: { byIata: Map<string, AirportLite>; byIcao: Map<string, AirportLite> }): { lat?: number; lon?: number } {
  if ((w.lat ?? undefined) !== undefined && (w.lon ?? undefined) !== undefined) return { lat: w.lat, lon: w.lon };
  if (w.iata && airports.byIata.has(w.iata.toUpperCase())) {
    const a = airports.byIata.get(w.iata.toUpperCase())!;
    return { lat: a.lat, lon: a.lon };
  }
  if (w.icao && airports.byIcao.has(w.icao.toUpperCase())) {
    const a = airports.byIcao.get(w.icao.toUpperCase())!;
    return { lat: a.lat, lon: a.lon };
  }
  return {};
}

// --- Defaults
const DEFAULT_SIM: SimConfig = {
  id: 'demo-conus',
  name: 'MS&A Demo – CONUS',
  startTimeUtc: new Date().toISOString(),
  durationMin: 120,
  loop: true,
  flights: [
    { id: 'f1', callsign: 'MSN101', from: { iata: 'JFK' }, to: { iata: 'LAX' }, speedKts: 470, cruiseAltFt: 36000, departOffsetMin: 0 },
    { id: 'f2', callsign: 'MSN202', from: { iata: 'DFW' }, to: { iata: 'SEA' }, speedKts: 450, cruiseAltFt: 34000, departOffsetMin: 15 },
  ],
};

// --- Component
export default function SimDesigner() {
  const [sim, setSim] = useState<SimConfig>(() => {
    const draft = localStorage.getItem('draftSim');
    return draft ? (JSON.parse(draft) as SimConfig) : DEFAULT_SIM;
  });
  const [airports, setAirports] = useState<AirportLite[]>([]);
  const airportIndex = useMemo(() => indexAirports(airports), [airports]);
  const [msg, setMsg] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean>(true);

  // Cesium viewer in the right pane
  const mapRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  useEffect(() => {
    (async () => {
      setAirports(await loadAirports());
    })();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const viewer = createViewer(mapRef.current);
    viewerRef.current = viewer;
    flyToCONUS(viewer);
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Draw preview routes when flights change
  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    v.entities.removeAll();
    for (const f of sim.flights) {
      const a = resolveWaypoint(f.from, airportIndex);
      const b = resolveWaypoint(f.to, airportIndex);
      if (a.lat == null || a.lon == null || b.lat == null || b.lon == null) continue;

      const aPos = Cesium.Cartesian3.fromDegrees(a.lon, a.lat, 10000);
      const bPos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, 10000);
      v.entities.add({
        polyline: {
          positions: [aPos, bPos],
          width: 2,
          material: Cesium.Color.ORANGE.withAlpha(0.8),
        },
      });
      // simple airplane billboard halfway along the route
      const mid = Cesium.Cartesian3.midpoint(aPos, bPos, new Cesium.Cartesian3());
      const headingDeg = initialBearingDeg(a.lat, a.lon, b.lat, b.lon);
      v.entities.add({
        position: mid,
        billboard: {
          image: '/images/vehicle-plane-filled.svg',
          scale: 0.4,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          rotation: svgRotationFromHeading(headingDeg, DEFAULT_SVG_NOSE_OFFSET_DEG),
        }
      });
    }
  }, [sim, airportIndex]);

  // recompute validity
  useEffect(() => {
    const res = validateSim(sim);
    setValid(res.ok);
    if (!res.ok) setMsg(res.message);
    else setMsg(null);
    localStorage.setItem('draftSim', JSON.stringify(sim));
  }, [sim]);

  function update<K extends keyof SimConfig>(key: K, val: SimConfig[K]) {
    setSim(prev => ({ ...prev, [key]: val }));
  }
  function updateFlight(idx: number, patch: Partial<FlightPlan>) {
    setSim(prev => ({ ...prev, flights: prev.flights.map((f, i) => (i === idx ? { ...f, ...patch } : f)) }));
  }
  function addFlight() {
    const n = sim.flights.length + 1;
    setSim(prev => ({
      ...prev,
      flights: [
        ...prev.flights,
        { id: `f${n}`, callsign: `MSN${100 + n}`, from: { iata: 'JFK' }, to: { iata: 'LAX' }, speedKts: 460, cruiseAltFt: 35000, departOffsetMin: 10 * n }
      ]
    }));
  }
  function removeFlight(idx: number) {
    setSim(prev => ({ ...prev, flights: prev.flights.filter((_, i) => i !== idx) }));
  }

  async function saveToServer() {
    const res = validateSim(sim);
    if (!res.ok) {
      notify({ message: res.message, type: 'error', displayTime: 2000 });
      return;
    }
    try {
      const base = (import.meta as any).env.VITE_API_URL || '';
      const name = `${sim.id}.json`;
      const r = await fetch(`${base}/api/sims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, json: sim })
      });
      if (!r.ok) throw new Error('save failed');
      notify({ message: `Saved ${name}`, type: 'success', displayTime: 1500 });
    } catch (e: any) {
      notify({ message: e?.message ?? 'Save failed', type: 'error', displayTime: 2500 });
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(sim, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${sim.id || 'simulation'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const labelSx: React.CSSProperties = { fontSize: 12, color: '#666', marginBottom: 4 };
  const rowSx: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 };

  return (
    <div style={{ height: '100%', width: '100%', padding: 8 }}>
      <ResponsiveBox singleColumnScreen="md" height="100%">
        <Row ratio={1} />
        <Row ratio={6} />
        <Col ratio={4} />
        <Col ratio={8} />

        {/* Header */}
        <Item>
          <Location row={0} col={0} colSpan={2} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontWeight: 600 }}>Simulation Designer</h2>
            <div style={{ fontSize: 12, color: valid ? '#2e7d32' : '#d32f2f' }}>
              {valid ? 'Ready' : (msg || 'Fix validation errors')}
            </div>
          </div>
        </Item>

        {/* Left pane: form */}
        <Item>
          <Location row={1} col={0} />
          <div style={{ paddingRight: 12, overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
            <div style={rowSx}>
              <div style={{ minWidth: 100 }}>
                <div style={labelSx}>Sim ID</div>
                <input value={sim.id} onChange={e => update('id', e.target.value)} placeholder="slug (used as filename)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelSx}>Name</div>
                <input value={sim.name} onChange={e => update('name', e.target.value)} placeholder="Human-friendly name" />
              </div>
            </div>
            <div style={rowSx}>
              <div>
                <div style={labelSx}>Start (UTC)</div>
                <input type="datetime-local"
                  value={(sim.startTimeUtc ?? new Date().toISOString()).slice(0, 16)}
                  onChange={e => update('startTimeUtc', new Date(e.target.value).toISOString())}
                />
              </div>
              <div>
                <div style={labelSx}>Duration (min)</div>
                <input type="number" value={sim.durationMin} min={1} step={5}
                  onChange={e => update('durationMin', Number(e.target.value))}
                  style={{ width: 120 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
                <input id="loop" type="checkbox" checked={!!sim.loop} onChange={e => update('loop', e.target.checked)} />
                <label htmlFor="loop">Loop</label>
              </div>
            </div>

            <h4 style={{ marginTop: 18 }}>Flights</h4>
            {sim.flights.map((f, idx) => (
              <div key={f.id} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8, marginBottom: 8 }}>
                <div style={rowSx}>
                  <div>
                    <div style={labelSx}>ID</div>
                    <input value={f.id} onChange={e => updateFlight(idx, { id: e.target.value })} style={{ width: 120 }} />
                  </div>
                  <div>
                    <div style={labelSx}>Callsign</div>
                    <input value={f.callsign} onChange={e => updateFlight(idx, { callsign: e.target.value })} style={{ width: 140 }} />
                  </div>
                  <div>
                    <div style={labelSx}>From (IATA/ICAO)</div>
                    <input value={f.from.iata ?? f.from.icao ?? ''} onChange={e => {
                      const v = e.target.value.toUpperCase();
                      updateFlight(idx, v.length === 4 ? { from: { icao: v } } : { from: { iata: v } });
                    }} style={{ width: 120 }} />
                  </div>
                  <div>
                    <div style={labelSx}>To (IATA/ICAO)</div>
                    <input value={f.to.iata ?? f.to.icao ?? ''} onChange={e => {
                      const v = e.target.value.toUpperCase();
                      updateFlight(idx, v.length === 4 ? { to: { icao: v } } : { to: { iata: v } });
                    }} style={{ width: 120 }} />
                  </div>
                </div>
                <div style={rowSx}>
                  <div>
                    <div style={labelSx}>Speed (kts)</div>
                    <input type="number" value={f.speedKts ?? 450} onChange={e => updateFlight(idx, { speedKts: Number(e.target.value) })} style={{ width: 110 }} />
                  </div>
                  <div>
                    <div style={labelSx}>Cruise Alt (ft)</div>
                    <input type="number" value={f.cruiseAltFt ?? 35000} onChange={e => updateFlight(idx, { cruiseAltFt: Number(e.target.value) })} style={{ width: 140 }} />
                  </div>
                  <div>
                    <div style={labelSx}>Depart +min</div>
                    <input type="number" value={f.departOffsetMin ?? 0} onChange={e => updateFlight(idx, { departOffsetMin: Number(e.target.value) })} style={{ width: 110 }} />
                  </div>
                  <div style={{ flex: 1 }} />
                  <Button text="Delete" onClick={() => removeFlight(idx)} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <Button text="+ Add flight" type="default" onClick={addFlight} />
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button text="Download JSON" onClick={downloadJson} />
              <Button text="Save to Server" type="success" onClick={saveToServer} disabled={!valid} />
            </div>
          </div>
        </Item>

        {/* Right pane: preview map */}
        <Item>
          <Location row={1} col={1} />
          <div ref={mapRef} style={{ height: 'calc(100vh - 100px)', width: '100%', borderRadius: 6, border: '1px solid #ddd' }} />
        </Item>
      </ResponsiveBox>
    </div>
  );
}

