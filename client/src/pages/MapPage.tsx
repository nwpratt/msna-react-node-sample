// src/pages/MapPage.tsx
import React, { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { createViewer, flyToCONUS } from "../lib/cesiumUtils";
import { addPlaneBillboard, addRouteLine, bearingDegrees, cart } from "../lib/airTraffic";

export default function MapPage() {
  const ref = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const viewer = createViewer(ref.current);
    viewerRef.current = viewer;

    (async () => {
      await flyToCONUS(viewer);

      // Demo: one synthetic leg across Texas -> Georgia
      const a = { lon: -102.0, lat: 31.0 };
      const b = { lon:  -84.0, lat: 33.0 };
      const posA = cart(a.lon, a.lat, 11000);
      const posB = cart(b.lon, b.lat, 11000);

      addRouteLine(viewer, posA, posB);
      const hdg = bearingDegrees(a.lat, a.lon, b.lat, b.lon);
      addPlaneBillboard({ viewer, position: posA, headingDeg: hdg, scale: 1.2, id: "demo-plane" });
    })();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
