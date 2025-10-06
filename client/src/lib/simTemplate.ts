// client/src/lib/simTemplate.ts
import { SimConfig } from "./simSchema";

export const SIM_TEMPLATE: SimConfig = {
  name: "CONUS example",
  seed: 42,
  startTime: new Date().toISOString(),
  durationMinutes: 120,
  airports: [
    { id: "ATL", name: "Atlanta", lat: 33.6367, lon: -84.4281 },
    { id: "DFW", name: "Dallas-Fort Worth", lat: 32.8998, lon: -97.0403 }
  ],
  aircraft: [
    { id: "DAL123", from: "ATL", to: "DFW", speedKts: 450, altFt: 35000 }
  ]
};
