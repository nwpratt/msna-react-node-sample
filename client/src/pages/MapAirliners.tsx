// src/pages/MapAirliners.tsx
import React, { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { createViewer, flyToCONUS } from "../lib/cesiumUtils";
import { addPlaneBillboard, addRouteLine, bearingDegrees, cart } from "../lib/airTraffic";

type SimList = string[] | { files: string[] };

export default function MapAirliners() {
  const ref = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  // left-rail state
  const [airports, setAirports] = useState<{ lon: number; lat: number; name?: string }[]>([]);
  const [simFiles, setSimFiles] = useState<string[]>([]);
  const [selectedSim, setSelectedSim] = useState<string>("new-sim.json");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // --- helpers
  const clearFlights = () => {
    const v = viewerRef.current;
    if (!v) return;
    v.entities.removeAll();
  };

  async function refreshList() {
    try {
      const r = await fetch("/api/sims");
      if (!r.ok) throw new Error(await r.text());
      const data: SimList = await r.json();
      const files = Array.isArray(data) ? data : data.files;
      setSimFiles(files ?? []);
    } catch (err) {
      console.warn("refreshList error:", err);
    }
  }

  async function runSimFromServer(name: string) {
    try {
      const r = await fetch(`/api/sims/${encodeURIComponent(name)}`);
      if (!r.ok) throw new Error(await r.text());
      const json = await r.json(); // expect { flights: [{ from:[lon,lat], to:[lon,lat], alt? }] }
      runSimLocal(json);
    } catch (err) {
      alert("Run failed: " + err);
    }
  }

  function runSimLocal(sim: any) {
    const v = viewerRef.current;
    if (!v) return;
    clearFlights();
    const flights = sim.flights ?? [];
    flights.forEach((f: any, idx: number) => {
      const [lonA, latA] = f.from;
      const [lonB, latB] = f.to;
      const h = f.alt ?? 11000;
      const pA = cart(lonA, latA, h);
      const pB = cart(lonB, latB, h);
      addRouteLine(v, pA, pB);
      const hdg = bearingDegrees(latA, lonA, latB, lonB);
      addPlaneBillboard({ viewer: v, position: pA, headingDeg: hdg, id: `sim-${idx}` });
    });
  }

  async function uploadAndRun() {
    if (!fileToUpload) {
      alert("Choose a JSON file first.");
      return;
    }
    const fd = new FormData();
    fd.append("file", fileToUpload, selectedSim || fileToUpload.name);

    const r = await fetch("/api/sims", { method: "POST", body: fd });
    if (!r.ok) {
      alert("Upload failed: " + (await r.text()));
      return;
    }
    // Refresh and run the uploaded name
    await refreshList();
    await runSimFromServer(selectedSim || fileToUpload.name);
  }

  async function generateFlights() {
    const v = viewerRef.current;
    if (!v || airports.length < 2) return;
    clearFlights();

    // sample pairs (random among first N)
    const N = Math.min(12, airports.length);
    const sample = airports.slice(0, N);
    for (let i = 0; i < sample.length - 1; i++) {
      const a = sample[i], b = sample[i + 1];
      const pA = cart(a.lon, a.lat, 11000);
      const pB = cart(b.lon, b.lat, 11000);
      addRouteLine(v, pA, pB);
      const hdg = bearingDegrees(a.lat, a.lon, b.lat, b.lon);
      addPlaneBillboard({ viewer: v, position: pA, headingDeg: hdg, id: `rand-${i}` });
    }
  }

  // --- mount
  useEffect(() => {
    (async () => {
      if (!ref.current) return;
      const viewer = createViewer(ref.current);
      viewerRef.current = viewer;
      await flyToCONUS(viewer);

      // airports (OpenFlights lite under /public/data/openflights/airports-lite.json)
      const resp = await fetch("/data/openflights/airports-lite.json", { cache: "force-cache" });
      const data = await resp.json();
      // expect array of { lon, lat, ... } or CSV-like arrays [id,name,city,country,lat,lon,...]
      const normalized: { lon: number; lat: number; name?: string }[] = Array.isArray(data)
        ? data.map((row: any) => {
            if (Array.isArray(row)) {
              const lat = Number(row[6]);
              const lon = Number(row[7]);
              const name = row[1] ?? "";
              if (Number.isFinite(lat) && Number.isFinite(lon)) return { lon, lat, name };
              return null;
            } else {
              const lat = Number(row.lat ?? row.latitude);
              const lon = Number(row.lon ?? row.longitude);
              const name = row.name ?? "";
              if (Number.isFinite(lat) && Number.isFinite(lon)) return { lon, lat, name };
              return null;
            }
          }).filter(Boolean)
        : [];
      setAirports(normalized);

      // pre-populate sim list if server endpoint exists
      refreshList().catch(() => void 0);
    })();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // --- UI
  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Left rail */}
      <div style={{
        position: "absolute", left: 12, top: 12, zIndex: 5,
        background: "rgba(10,14,20,.85)", color: "#d8e2f2",
        padding: 12, borderRadius: 6, minWidth: 260
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Airliners (synthetic)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button onClick={generateFlights}>Generate flights</button>
          <button onClick={clearFlights}>Clear flights</button>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: .8 }}>
          Tip: list parser accepts <code>{"a.json"}</code> or{" "}
          <code>{`{ files: ["a.json"] }`}</code>.
        </div>

        {/* Sim runner */}
        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <select
              value={selectedSim}
              onChange={(e) => setSelectedSim(e.target.value)}
              style={{ flex: 1 }}
            >
              {[selectedSim, ...simFiles.filter(f => f !== selectedSim)].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button onClick={() => runSimFromServer(selectedSim)}>Run</button>
            <button onClick={refreshList}>Refresh</button>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => setFileToUpload(e.target.files?.[0] ?? null)}
            />
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              placeholder="new-sim.json"
              value={selectedSim}
              onChange={(e) => setSelectedSim(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={uploadAndRun}>Upload & Run</button>
          </div>
        </div>
      </div>

      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
