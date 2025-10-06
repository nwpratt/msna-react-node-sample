// client/src/lib/terrain.ts
import * as Cesium from 'cesium';

/**
 * Set world terrain in a way that works across Cesium versions:
 * 1) Terrain.fromWorldTerrain()  (new API)
 * 2) createWorldTerrain()        (classic helper)
 * 3) CesiumTerrainProvider + IonResource fallback
 * 4) EllipsoidTerrainProvider    (no terrain)
 */
export async function setVersionSafeTerrain(viewer: Cesium.Viewer) {
  const C: any = Cesium;
  try {
    if (C.Terrain?.fromWorldTerrain) {
      // Cesium 1.1xx+
      const terrain = await C.Terrain.fromWorldTerrain();
      viewer.scene.terrain = terrain;
    } else if (C.createWorldTerrain) {
      // Classic helper
      viewer.terrainProvider = C.createWorldTerrain();
    } else if (C.CesiumTerrainProvider?.fromUrl && C.IonResource) {
      // Fallback to Ion asset 1 (World Terrain)
      const provider = await C.CesiumTerrainProvider.fromUrl(
        C.IonResource.fromAssetId(1)
      );
      viewer.terrainProvider = provider;
    } else {
      console.warn('[terrain] No world terrain helpers; using ellipsoid.');
      viewer.terrainProvider = new C.EllipsoidTerrainProvider();
    }
  } catch (err) {
    console.error('[terrain] Failed; using ellipsoid.', err);
    viewer.terrainProvider = new (Cesium as any).EllipsoidTerrainProvider();
  }
}

/**
 * Add OSM Buildings if the current Cesium version exposes the helper.
 * Safe no‑op if unavailable.
 */
export async function addOsmBuildingsSafe(viewer: Cesium.Viewer) {
  const C: any = Cesium;
  try {
    if (C.createOsmBuildings) {
      const layer = C.createOsmBuildings();
      viewer.scene.primitives.add(layer);
      return layer;
    }
    if (C.createOsmBuildingsAsync) {
      const layer = await C.createOsmBuildingsAsync();
      viewer.scene.primitives.add(layer);
      return layer;
    }
  } catch (e) {
    console.warn('[terrain] OSM Buildings not added:', e);
  }
  return null;
}
