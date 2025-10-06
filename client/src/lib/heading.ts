// client/src/lib/heading.ts
/**
 * Utilities for converting a flight heading (deg) into an SVG rotation (rad).
 * We keep this in one place so the math is easy to regression test with Vitest.
 */

/** Normalize any degrees value to [0, 360). */
export function normalizeDeg(d: number): number {
  const n = d % 360;
  return n < 0 ? n + 360 : n;
}

/** Convert degrees to radians. */
export function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

/**
 * Default nose direction of our `/public/icons/vehicle-plane-filled.svg`.
 * The asset in this repo points roughly North-East out of the box, so we use +45°.
 * If you change the icon, update this value or pass a custom offset to svgRotationFromHeading.
 */
export const DEFAULT_SVG_NOSE_OFFSET_DEG = 45;

/**
 * Given a true heading in degrees (0° = North, 90° = East), return the rotation in radians
 * to apply to an SVG that points "up" (0°) by default. If your SVG points a different
 * direction when rotation=0, pass `noseOffsetDeg` (e.g., 45 for NE).
 *
 * NOTE: Cesium Billboard rotation is measured in radians _counter-clockwise_ from the image's
 * default up direction. Our convention here matches that.
 */
export function svgRotationFromHeading(
  headingDeg: number,
  noseOffsetDeg: number = DEFAULT_SVG_NOSE_OFFSET_DEG
): number {
  // normalize heading and offset to [0, 360), sum, then convert to radians
  const total = normalizeDeg(headingDeg + noseOffsetDeg);
  return degToRad(total);
}


/** Initial great-circle bearing (deg) from A -> B. */
export function initialBearingDeg(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const φ1 = degToRad(aLat), φ2 = degToRad(bLat);
  const Δλ = degToRad(bLon - aLon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const deg = (θ * 180) / Math.PI;
  return normalizeDeg(deg);
}
