// src/lib/airTraffic.ts
import * as Cesium from "cesium";
import planeIconUrl from "/icons/vehicle-plane-filled.svg?url";

/**
 * If the SVG points EAST with zero rotation, offset = 0.
 * If it points NORTH with zero rotation, offset = +90° (Math.PI/2).
 * Your "vehicle-plane-filled.svg" points roughly North-East; after testing,
 * a +45° offset makes the nose align naturally with heading.
 */
export const PLANE_ROT_OFFSET_RAD = Cesium.Math.toRadians(45);

/** Great-circle initial bearing (deg) from A -> B. */
export function bearingDegrees(aLat: number, aLon: number, bLat: number, bLon: number) {
  const φ1 = Cesium.Math.toRadians(aLat);
  const φ2 = Cesium.Math.toRadians(bLat);
  const λ1 = Cesium.Math.toRadians(aLon);
  const λ2 = Cesium.Math.toRadians(bLon);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  let deg = Cesium.Math.toDegrees(θ);
  if (deg < 0) deg += 360;
  return deg;
}

/** Build a billboard for a plane heading (deg) at a position. Returns the entity. */
export function addPlaneBillboard(opts: {
  viewer: Cesium.Viewer;
  position: Cesium.Cartesian3;
  headingDeg: number;
  id?: string;
  scale?: number;
  color?: Cesium.Color;
}) {
  const { viewer, position, headingDeg, id, scale = 1.0 } = opts;

  const entity = viewer.entities.add({
    id,
    position,
    billboard: {
      image: planeIconUrl,
      // rotate nose along movement (heading Deg + SVG offset)
      rotation:
        Cesium.Math.toRadians(headingDeg) + PLANE_ROT_OFFSET_RAD,
      alignedAxis: Cesium.Cartesian3.UNIT_Z, // keep billboard in screen plane for rotation
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      scaleByDistance: new Cesium.NearFarScalar(500_000, 0.6 * scale, 2_000_000, 0.25 * scale),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10_000_000.0),
      eyeOffset: new Cesium.Cartesian3(0, 0, 0),
    },
  });
  return entity;
}

/** Draw a yellow route line between two points (for debugging). */
export function addRouteLine(
  viewer: Cesium.Viewer,
  a: Cesium.Cartesian3,
  b: Cesium.Cartesian3
) {
  return viewer.entities.add({
    polyline: {
      positions: [a, b],
      width: 2,
      material: Cesium.Color.YELLOW,
    },
  });
}

/** Utility to transform [lon, lat] to Cartesian3. */
export function cart(lon: number, lat: number, h = 10000) {
  return Cesium.Cartesian3.fromDegrees(lon, lat, h);
}
