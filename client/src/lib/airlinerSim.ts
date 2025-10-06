import * as Cesium from 'cesium';

export type Airport = {
  id: number;
  name: string;
  city?: string;
  country?: string;
  iata?: string;
  icao?: string;
  lat: number;
  lon: number;
};

export type FlightGenOptions = {
  count: number;           // number of flights to spawn
  minCruiseMeters?: number; // default 9–11km cruise
  maxCruiseMeters?: number;
  speedMps?: number;        // ~250 m/s ≈ 900 km/h
  arcSamples?: number;      // points along the geodesic
  start?: Cesium.JulianDate;
};

const DEFAULT_HUBS: Airport[] = [
  { id: 1, name: 'ATL', city: 'Atlanta', country: 'US', lat: 33.6407, lon: -84.4277 },
  { id: 2, name: 'LAX', city: 'Los Angeles', country: 'US', lat: 33.9416, lon: -118.4085 },
  { id: 3, name: 'JFK', city: 'New York', country: 'US', lat: 40.6413, lon: -73.7781 },
  { id: 4, name: 'LHR', city: 'London', country: 'UK', lat: 51.4700, lon: -0.4543 },
  { id: 5, name: 'CDG', city: 'Paris', country: 'FR', lat: 49.0097, lon: 2.5479 },
  { id: 6, name: 'HND', city: 'Tokyo', country: 'JP', lat: 35.5494, lon: 139.7798 },
  { id: 7, name: 'DXB', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  { id: 8, name: 'SIN', city: 'Singapore', country: 'SG', lat: 1.3644, lon: 103.9915 },
  { id: 9, name: 'SYD', city: 'Sydney', country: 'AU', lat: -33.9399, lon: 151.1753 },
  { id:10, name: 'GRU', city: 'São Paulo', country: 'BR', lat: -23.4356, lon: -46.4731 },
];

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickTwo<T>(arr: T[]) {
  const a = Math.floor(Math.random() * arr.length);
  let b = Math.floor(Math.random() * arr.length);
  while (b === a) b = Math.floor(Math.random() * arr.length);
  return [arr[a], arr[b]] as [T, T];
}

/** Ease in/out for climb/descent altitudes */
function easeInOut(t: number) {
  return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
}

/** Build a dynamic entity that flies from A→B along a geodesic with climb/cruise/descent */
export function makeFlightEntity(viewer: Cesium.Viewer, from: Airport, to: Airport, opts: FlightGenOptions) {
  const start = (opts.start ?? Cesium.JulianDate.now());
  const arcSamples = opts.arcSamples ?? 64;
  const speed = opts.speedMps ?? 250; // m/s
  const minCruise = opts.minCruiseMeters ?? 9000;
  const maxCruise = opts.maxCruiseMeters ?? 11000;

  const startCarto = Cesium.Cartographic.fromDegrees(from.lon, from.lat);
  const endCarto   = Cesium.Cartographic.fromDegrees(to.lon,   to.lat);

  const geod = new Cesium.EllipsoidGeodesic(startCarto, endCarto);
  const surfaceDistance = geod.surfaceDistance; // meters
  const durationSeconds = surfaceDistance / speed;

  const pos = new Cesium.SampledPositionProperty();
  pos.setInterpolationOptions({
    interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
    interpolationDegree: 2,
  });

  const samples = arcSamples;
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const carto = geod.interpolateUsingFraction(f);
    // altitude profile: climb→cruise→descent
    const climbFrac = Math.min(f * 2, 1);
    const descentFrac = Math.max((f - 0.5) * 2, 0);
    const cruise = randBetween(minCruise, maxCruise);
    const h = (f < 0.5)
      ? easeInOut(climbFrac) * cruise
      : (1 - easeInOut(descentFrac)) * cruise;

    const time = Cesium.JulianDate.addSeconds(start, durationSeconds * f, new Cesium.JulianDate());
    const p = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, h);
    pos.addSample(time, p);
  }

  const stop = Cesium.JulianDate.addSeconds(start, durationSeconds, new Cesium.JulianDate());

  return viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start, stop })
    ]),
    position: pos,
    orientation: new Cesium.VelocityOrientationProperty(pos),
    billboard: {
      image: '/icons/airplane-white.png', // place a small white plane PNG in /public/icons
      scale: 0.6,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
    },
    path: new Cesium.PathGraphics({
      width: 2,
      leadTime: 0,
      trailTime: Math.min(900, durationSeconds), // seconds of trail
      material: Cesium.Color.CYAN.withAlpha(0.6),
    }),
    description: `${from.name} → ${to.name}`,
  });
}

/** Spawn N flights; return cleanup */
export function spawnFlights(viewer: Cesium.Viewer, airports: Airport[], options: FlightGenOptions) {
  const hubs = airports?.length ? airports : DEFAULT_HUBS;
  const start = options.start ?? Cesium.JulianDate.now();

  viewer.clock.startTime = start.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.stopTime = Cesium.JulianDate.addHours(start, 8, new Cesium.JulianDate());
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 120; // time speed
  viewer.timeline?.zoomTo(viewer.clock.startTime, viewer.clock.stopTime);

  const entities: Cesium.Entity[] = [];
  const count = Math.max(1, options.count);
  for (let i = 0; i < count; i++) {
    const [a, b] = pickTwo(hubs);
    entities.push(makeFlightEntity(viewer, a, b, { ...options, start }));
  }

  return () => {
    entities.forEach(e => viewer.entities.remove(e));
  };
}
