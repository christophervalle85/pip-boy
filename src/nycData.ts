export type SubwayStation = {
  id: string;
  name: string;
  borough: string;
  routes: string;
  accessible: boolean | null;
  latitude: number;
  longitude: number;
};

export type ServiceRequest = {
  id: string;
  type: string;
  detail: string;
  borough: string;
  status: string;
  address: string;
  created: string;
  latitude: number;
  longitude: number;
};

export type GeoBounds = { south: number; west: number; north: number; east: number };

const CITY = { south: 40.47, west: -74.28, north: 40.94, east: -73.68 };

export const BOROUGH_VIEWS = [
  { name: 'NYC', center: [40.714, -73.987] as [number, number], zoom: 11 },
  { name: 'Manhattan', center: [40.757, -73.984] as [number, number], zoom: 12 },
  { name: 'Brooklyn', center: [40.681, -73.966] as [number, number], zoom: 12 },
  { name: 'Queens', center: [40.734, -73.864] as [number, number], zoom: 11 },
  { name: 'Bronx', center: [40.843, -73.881] as [number, number], zoom: 12 },
  { name: 'Staten Island', center: [40.590, -74.147] as [number, number], zoom: 12 },
];

function validCoordinates(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= CITY.south && lat <= CITY.north && lng >= CITY.west && lng <= CITY.east;
}

async function loadRows(url: URL, signal: AbortSignal): Promise<Record<string, unknown>[]> {
  const response = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('DATA FEED UNAVAILABLE (HTTP ' + response.status + ')');
  const result: unknown = await response.json();
  if (!Array.isArray(result)) throw new Error('UNEXPECTED DATA FEED RESPONSE');
  return result as Record<string, unknown>[];
}

function field(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export async function fetchStations(signal: AbortSignal): Promise<SubwayStation[]> {
  const url = new URL('https://data.ny.gov/resource/39hk-dx4f.json');
  url.searchParams.set('$select', 'station_id,stop_name,borough,gtfs_latitude,gtfs_longitude,daytime_routes,ada');
  url.searchParams.set('$limit', '1000');
  const rows = await loadRows(url, signal);
  return rows.map((row, index) => {
    const latitude = Number(field(row, 'gtfs_latitude'));
    const longitude = Number(field(row, 'gtfs_longitude'));
    const ada = field(row, 'ada');
    return {
      id: field(row, 'station_id') || String(index),
      name: field(row, 'stop_name') || 'UNKNOWN STATION',
      borough: field(row, 'borough'),
      routes: field(row, 'daytime_routes') || 'NO ROUTES LISTED',
      accessible: ada === '1' ? true : ada === '0' ? false : null,
      latitude, longitude,
    };
  }).filter((station) => validCoordinates(station.latitude, station.longitude));
}

export async function fetchRecent311(view: GeoBounds, signal: AbortSignal): Promise<ServiceRequest[]> {
  const url = new URL('https://data.cityofnewyork.us/resource/erm2-nwe9.json');
  const south = Math.max(CITY.south, view.south);
  const north = Math.min(CITY.north, view.north);
  const west = Math.max(CITY.west, view.west);
  const east = Math.min(CITY.east, view.east);
  if (south >= north || west >= east) return [];

  // This is a bounded sample of recent records in the visible area, not a full 311 count.
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 19);
  url.searchParams.set('$select', 'unique_key,complaint_type,descriptor,borough,status,incident_address,created_date,latitude,longitude');
  url.searchParams.set('$where',
    "created_date >= '" + since + "' AND latitude BETWEEN " + south.toFixed(5) + ' AND ' + north.toFixed(5) +
    ' AND longitude BETWEEN ' + west.toFixed(5) + ' AND ' + east.toFixed(5));
  url.searchParams.set('$order', 'created_date DESC');
  url.searchParams.set('$limit', '80');

  const rows = await loadRows(url, signal);
  return rows.map((row, index) => ({
    id: field(row, 'unique_key') || String(index),
    type: field(row, 'complaint_type') || 'SERVICE REQUEST',
    detail: field(row, 'descriptor'),
    borough: field(row, 'borough'),
    status: field(row, 'status') || 'UNKNOWN',
    address: field(row, 'incident_address') || 'LOCATION NOT LISTED',
    created: field(row, 'created_date'),
    latitude: Number(field(row, 'latitude')),
    longitude: Number(field(row, 'longitude')),
  })).filter((request) => validCoordinates(request.latitude, request.longitude));
}

export function distanceMiles(a: [number, number], b: [number, number]): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b[0] - a[0]);
  const dLon = radians(b[1] - a[1]);
  const lat1 = radians(a[0]);
  const lat2 = radians(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
