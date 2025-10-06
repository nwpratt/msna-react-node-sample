// client/src/lib/__tests__/heading.test.ts
import { describe, it, expect } from 'vitest';
import { svgRotationFromHeading, degToRad, DEFAULT_SVG_NOSE_OFFSET_DEG, initialBearingDeg } from '../heading';

describe('svgRotationFromHeading', () => {
  it('applies default +45° nose offset', () => {
    expect(svgRotationFromHeading(0)).toBeCloseTo(degToRad(0 + DEFAULT_SVG_NOSE_OFFSET_DEG), 6);
    expect(svgRotationFromHeading(90)).toBeCloseTo(degToRad(90 + DEFAULT_SVG_NOSE_OFFSET_DEG), 6);
    expect(svgRotationFromHeading(180)).toBeCloseTo(degToRad(180 + DEFAULT_SVG_NOSE_OFFSET_DEG), 6);
    expect(svgRotationFromHeading(270)).toBeCloseTo(degToRad(270 + DEFAULT_SVG_NOSE_OFFSET_DEG), 6);
  });

  it('supports overriding the nose offset', () => {
    // For an icon that points NORTH at rotation 0
    expect(svgRotationFromHeading(0, 0)).toBeCloseTo(degToRad(0), 6);
    expect(svgRotationFromHeading(90, 0)).toBeCloseTo(degToRad(90), 6);
  });

  it('normalizes negative and >360° headings the same way', () => {
    expect(svgRotationFromHeading(-90, 0)).toBeCloseTo(degToRad(270), 6);
    expect(svgRotationFromHeading(450, 0)).toBeCloseTo(degToRad(90), 6);
  });
});



describe('initialBearingDeg', () => {
  it('computes bearings for cardinal/diagonal cases', () => {
    // Equator east: (0,0) -> (0,10) ~ 90°
    expect(Math.round(initialBearingDeg(0, 0, 0, 10))).toBe(90);
    // Equator west: (0,10) -> (0,0) ~ 270°
    expect(Math.round(initialBearingDeg(0, 10, 0, 0))).toBe(270);
    // North: (0,0) -> (10,0) ~ 0°
    expect(Math.round(initialBearingDeg(0, 0, 10, 0))).toBe(0);
    // South: (10,0) -> (0,0) ~ 180°
    expect(Math.round(initialBearingDeg(10, 0, 0, 0))).toBe(180);
  });
});

