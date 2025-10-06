// shared/sim-types.ts
export type Waypoint = {
  /** Prefer one of IATA/ICAO, else lat/lon.
   *  We'll resolve IATA/ICAO into lat/lon using the OpenFlights dataset. */
  iata?: string;
  icao?: string;
  lat?: number;
  lon?: number;
  altFt?: number; // optional: waypoint altitude override
};

export type FlightPlan = {
  id: string;        // stable id
  callsign: string;  // e.g. "MSN123"
  from: Waypoint;
  to: Waypoint;
  speedKts?: number;     // default: 450
  cruiseAltFt?: number;  // default: 34_000
  departOffsetMin?: number; // offset from sim start
};

export type SimConfig = {
  id: string;               // slug
  name: string;             // human-friendly
  startTimeUtc?: string;    // ISO; default: now UTC
  durationMin: number;      // total sim window
  loop?: boolean;           // loop flights after arrival
  flights: FlightPlan[];
};
