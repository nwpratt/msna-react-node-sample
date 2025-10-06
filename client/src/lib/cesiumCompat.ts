// Version‑safe Cesium helpers.
import * as Cesium from "cesium";
// Use the stable widgets.css path that works across NPM versions
import "cesium/Build/Cesium/Widgets/widgets.css";

/** Return a terrain provider using whichever API this Cesium build supports. */
export async function getWorldTerrain(opts?: {
  requestVertexNormals?: boolean;
  requestWaterMask?: boolean;
}) {
  const options = { requestVertexNormals: true, requestWaterMask: true, ...opts };

  // Newer API (2024+): Cesium.Terrain.fromWorldTerrain(...)
  const anyTerrain = (Cesium as any).Terrain;
  if (anyTerrain && typeof anyTerrain.fromWorldTerrain === "function") {
    return anyTerrain.fromWorldTerrain(options);
  }

  // Transitional API
  if (typeof (Cesium as any).createWorldTerrainAsync === "function") {
    return (Cesium as any).createWorldTerrainAsync(options);
  }

  // Older/stable API
  if (typeof (Cesium as any).createWorldTerrain === "function") {
    return (Cesium as any).createWorldTerrain(options);
  }

  // Last resort: flat ellipsoid (no elevation)
  return new Cesium.EllipsoidTerrainProvider();
}

/** Set the Ion token if present in your env. Safe to call multiple times. */
export function applyIonTokenFromEnv() {
  const token = (import.meta as any).env?.VITE_CESIUM_ION_TOKEN;
  if (token && Cesium.Ion.defaultAccessToken !== token) {
    Cesium.Ion.defaultAccessToken = token;
  }
}

/** Quick camera fly‑to for CONUS. */
export function flyToCONUS(viewer: Cesium.Viewer, durationSec = 0.0) {
  const west  = Cesium.Math.toRadians(-125.0);
  const south = Cesium.Math.toRadians(  24.0);
  const east  = Cesium.Math.toRadians( -66.9);
  const north = Cesium.Math.toRadians(  49.5);
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromRadians(west, south, east, north),
    duration: durationSec
  });
}
