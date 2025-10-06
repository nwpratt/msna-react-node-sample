
import fetch from 'node-fetch';

const ROUTES_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat';
const AIRPORTS_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
export const ROUTE_LIMIT = 300; // tune for fewer arcs

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch failed: ' + url);
  return res.text();
}

function parseAirports(csv) {
  // id, name, city, country, iata, icao, lat, lon, alt, tz, dst, tzdb, type, source
  const map = new Map();
  csv.split('\n').forEach(line => {
    const parts = line.split(',');
    if (parts.length < 8) return;
    const id = parts[0];
    const lat = parseFloat(parts[6]);
    const lon = parseFloat(parts[7]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.set(id, { lat, lon });
    }
  });
  return map;
}

export async function getSampleRoutes(limit = ROUTE_LIMIT) {
  const [routesCsv, airportsCsv] = await Promise.all([fetchText(ROUTES_URL), fetchText(AIRPORTS_URL)]);
  const airports = parseAirports(airportsCsv);
  const routes = [];
  for (const line of routesCsv.split('\n')) {
    const p = line.split(',');
    if (p.length < 9) continue;
    const srcId = p[3];
    const dstId = p[5];
    const a = airports.get(srcId);
    const b = airports.get(dstId);
    if (!a || !b) continue;
    routes.push({ a, b });
    if (routes.length >= limit) break;
  }
  return routes;
}
