// src/lib/cesiumUtils.ts
import * as Cesium from "cesium";
// Widgets CSS path that works across Cesium versions bundled by Vite
import "cesium/Build/Cesium/Widgets/widgets.css";

/**
 * Creates a world-terrain provider that is resilient to Cesium API changes.
 * Requires a Cesium Ion token (VITE_CESIUM_ION_TOKEN) for best results.
 */
export function makeWorldTerrain(): any {
  const C: any = Cesium as any;

  // new-ish Cesium
  if (C.createWorldTerrain) return C.createWorldTerrain();

  // very new (namespaced Terrain API)
  if (C.Terrain?.fromWorldTerrain) return C.Terrain.fromWorldTerrain();

  // fallback to ion asset
  const IonResource = C.IonResource || (C.Ion && C.Ion.Resource);
  const CesiumTerrainProvider = C.CesiumTerrainProvider || C.TerrainProvider;
  if (IonResource && CesiumTerrainProvider) {
    return new CesiumTerrainProvider({
      url: IonResource.fromAssetId(1), // World Terrain
    });
  }

  // final fallback – ellipsoid
  return new C.EllipsoidTerrainProvider();
}

/**
 * Creates a viewer with sane defaults (navigation, base layer, terrain).
 */
export function createViewer(container: HTMLElement) {
  // If Ion token is present, set it
  if (import.meta.env.VITE_CESIUM_ION_TOKEN) {
    (Cesium as any).Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
  }

  const viewer = new Cesium.Viewer(container, {
    animation: false,
    timeline: false,
    baseLayerPicker: true,
    geocoder: false,
    terrainProvider: makeWorldTerrain(),
    scene3DOnly: true,
    selectionIndicator: false,
    infoBox: false,
    navigationHelpButton: false,
    // Keep the UI minimal but familiar
  });

  // a little quality + UX
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.scene.highDynamicRange = true;

  return viewer;
}

/**
 * Fly to a reasonable CONUS view.
 */
export async function flyToCONUS(viewer: Cesium.Viewer) {
  const rect = Cesium.Rectangle.fromDegrees(-126, 23, -66, 50); // CONUS-ish
  await viewer.camera.flyTo({
    destination: Cesium.Rectangle.southwest(rect),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-35), roll: 0 },
    duration: 0.0,
  });
  viewer.camera.setView({ destination: rect });
}
