// client/src/pages/SimRunner.tsx
import "devextreme/dist/css/dx.light.css";
import ResponsiveBox, { Row, Col, Item, Location } from "devextreme-react/responsive-box";
import List from "devextreme-react/list";
import Button from "devextreme-react/button";
import FileUploader from "devextreme-react/file-uploader";
import notify from "devextreme/ui/notify";

import React, { useEffect, useMemo, useState } from "react";
import { listSims, getSim, saveSim } from "../api/sims";
import { SIM_TEMPLATE } from "../lib/simTemplate";
import { simSchema, type SimConfig } from "../lib/simSchema";
import { simToFlights } from "../lib/simToFlights";
import MapAirliners from "./MapAirliners"; // your existing page/component

export default function SimRunner() {
  const [files, setFiles] = useState<{ name: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sim, setSim] = useState<SimConfig | null>(null);
  const [running, setRunning] = useState(false);

  const refresh = async () => {
    const r = await listSims();
    setFiles(r.files.map(f => ({ name: f.name })));
  };

  useEffect(() => { refresh().catch(console.error); }, []);

  async function loadSelected() {
    if (!selected) return;
    try {
      const cfg = await getSim(selected);
      const parsed = simSchema.parse(cfg);
      setSim(parsed);
      setRunning(true); // auto-run when loaded
    } catch (e: any) {
      notify(`Load failed: ${e.message}`, "error", 3000);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([JSON.stringify(SIM_TEMPLATE, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sim-template.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function uploadNew(file: File) {
    try {
      const text = await file.text();
      const json = simSchema.parse(JSON.parse(text));
      await saveSim(file.name, json);
      notify(`Saved ${file.name}`, "success", 2000);
      await refresh();
    } catch (e: any) {
      notify(`Upload failed: ${e.message}`, "error", 4000);
    }
  }

  const runData = useMemo(() => (sim ? simToFlights(sim) : null), [sim]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ResponsiveBox singleColumnScreen="sm" height="100%">
        <Row ratio={1} />
        <Col baseSize={320} /> {/* left column width */}
        <Col ratio={1} />      {/* right fills */}

        {/* LEFT: control rail */}
        <Item>
          <Location row={0} col={0} />
          <div style={{ padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Simulations</h3>

            <div style={{ marginBottom: 8 }}>
              <Button text="Download template" onClick={downloadTemplate} width={200} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <FileUploader
                selectButtonText="Upload JSON"
                multiple={false}
                accept="application/json"
                uploadMode="useButtons"
                onValueChanged={async (e) => {
                  const f = e.value?.[0];
                  if (f) await uploadNew(f);
                }}
              />
            </div>

            <div style={{ margin: "12px 0 6px" }}>Available:</div>
            <List
              height={300}
              items={files}
              keyExpr="name"
              selectedItemKeys={selected ? [selected] : []}
              onSelectionChanged={(e) => setSelected(e.addedItems?.[0]?.name ?? null)}
              displayExpr="name"
            />

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <Button text="Load & Run" type="default" onClick={loadSelected} disabled={!selected} />
              <Button text={running ? "Pause" : "Resume"} onClick={() => setRunning(r => !r)} disabled={!sim} />
              <Button text="Stop" onClick={() => { setRunning(false); setSim(null); }} disabled={!sim} />
            </div>
          </div>
        </Item>

        {/* RIGHT: map + air traffic */}
        <Item>
          <Location row={0} col={1} />
          <div style={{ height: "100%", width: "100%" }}>
            {/* MapAirliners already renders the Cesium viewer full-bleed */}
            <MapAirliners
              sim={runData ?? undefined}
              running={running}
              // preserve your existing props (ion token, theme, etc.) if any
            />
          </div>
        </Item>
      </ResponsiveBox>
    </div>
  );
}
