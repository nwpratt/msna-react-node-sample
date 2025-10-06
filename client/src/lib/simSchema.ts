// client/src/lib/simSchema.ts
import { z } from "zod";

export const airportSchema = z.object({
  id: z.string(),                 // IATA/ICAO or your own id
  name: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const aircraftSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  speedKts: z.number().positive().default(450),
  altFt: z.number().positive().default(35000),
});

export const simSchema = z.object({
  name: z.string(),
  seed: z.number().optional(),     // optional deterministic seed
  startTime: z.string().datetime().optional(),
  durationMinutes: z.number().positive().default(120),
  airports: z.array(airportSchema).nonempty(),
  aircraft: z.array(aircraftSchema).nonempty(),
});

export type SimConfig = z.infer<typeof simSchema>;
