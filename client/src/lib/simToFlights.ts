// client/src/lib/simToFlights.ts
import type { SimConfig } from "./simSchema";
import type { Airport, FlightPlan } from "../lib/airTraffic"; // your existing types

export function simToFlights(sim: SimConfig): { airports: Airport[]; flights: FlightPlan[] } {
  const airports: Airport[] = sim.airports.map(a => ({
    id: a.id, name: a.name ?? a.id, lat: a.lat, lon: a.lon
  }));

  const flights: FlightPlan[] = sim.aircraft.map(a => ({
    id: a.id,
    from: a.from,
    to: a.to,
    speedKts: a.speedKts ?? 450,
    altFt: a.altFt ?? 35000,
  }));

  return { airports, flights };
}
