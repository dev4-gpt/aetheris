import { observation } from './observations.js';
import { json2satrec, propagate, gstime, eciToGeodetic, degreesLong, degreesLat } from 'satellite.js';

const USER_AGENT = 'AetherisPilot/1.0 (public-data planning; source links in application)';
const SOURCES = Object.freeze({
  earthquakes: { url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', source: 'usgs', license: 'US public domain; credit USGS', ttl: 60_000, coverage: 'Global reported events' },
  events: { url: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100', source: 'nasa-eonet', license: 'NASA EONET public event metadata; inspect linked imagery rights', ttl: 5 * 60_000, coverage: 'Global curated events' },
  weather: { url: 'https://api.weather.gov/alerts/active', source: 'nws', license: 'US public domain; credit NOAA/NWS', ttl: 2 * 60_000, coverage: 'United States alerts' },
  satellites: { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json', source: 'celestrak', license: 'CelesTrak GP usage policy; credit CelesTrak', ttl: 2 * 60 * 60_000, coverage: 'Orbital elements; positions are predictions' },
  maritime: { url: 'https://meri.digitraffic.fi/api/ais/v1/locations', source: 'fintraffic', license: 'CC BY 4.0; credit Fintraffic / digitraffic.fi', ttl: 60_000, coverage: 'Finnish waterways' },
  news: { url: 'https://api.gdeltproject.org/api/v2/doc/doc?query=earthquake%20OR%20wildfire%20OR%20flood&mode=artlist&format=json&maxrecords=25', source: 'gdelt', license: 'Free commercial use with GDELT attribution; linked articles retain publisher rights', ttl: 10 * 60_000, coverage: 'Global indexed reports; locations are not verified event positions' },
  wind: { url: 'https://api.weather.gov/points/', source: 'nws', license: 'US public domain; credit NOAA/NWS', ttl: 30 * 60_000, coverage: 'U.S. point forecast; selected area only' },
  rain: { url: 'https://api.weather.gov/points/', source: 'nws', license: 'US public domain; credit NOAA/NWS', ttl: 30 * 60_000, coverage: 'U.S. point forecast; selected area only' }
});

export const LAYERS = Object.freeze([
  ...Object.entries(SOURCES).map(([id, s]) => ({ id, title: id[0].toUpperCase() + id.slice(1), source: s.source, sourceUrl: s.url, license: s.license, coverage: s.coverage, mode: 'feed' })),
  { id: 'flights', title: 'Flights', source: null, coverage: 'Pending production source permission', mode: 'permission-gated' },
  { id: 'cctv', title: 'CCTV', source: null, coverage: 'Operator metadata and external links only', mode: 'permission-gated' },
  { id: 'cables', title: 'Cables', source: null, coverage: 'Commercial-use data permission pending', mode: 'permission-gated' },
  { id: 'day-night', title: 'Day and night', source: 'local computation', coverage: 'Global', mode: 'computed' },
  { id: 'sea-scenario', title: 'Sea scenario', source: 'aetheris', coverage: 'User scenario', mode: 'synthetic' },
  { id: 'air-scenario', title: 'Air scenario', source: 'aetheris', coverage: 'User scenario', mode: 'synthetic' },
  { id: 'naval-scenario', title: 'Naval scenario', source: 'aetheris', coverage: 'User scenario', mode: 'synthetic' }
]);

function point(coordinates) {
  return Array.isArray(coordinates) && coordinates.length >= 2 && Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1]))
    ? [Number(coordinates[0]), Number(coordinates[1])] : null;
}

function timestamp(value, fallback = null) {
  if (typeof value === 'number') {
    const time = value < 10_000_000_000 ? value * 1000 : value;
    return Number.isFinite(time) ? new Date(time).toISOString() : fallback;
  }
  if (typeof value === 'string' && /^\d{8}T\d{6}Z$/.test(value)) value = value.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z');
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : fallback;
}

function freshness(observedAt, fetchedAt, maxAgeMs) {
  const age = Date.parse(fetchedAt) - Date.parse(observedAt);
  return age >= -60_000 && age <= maxAgeMs ? 'live' : 'delayed';
}

function aisTime(properties) {
  // Digitraffic's AIS `timestamp` is the seconds field (0–59); the actual UTC
  // message time is `timestampExternal` in Unix milliseconds.
  return timestamp(properties.timestampExternal ?? properties.time ?? properties.updated ??
    (Number(properties.timestamp) > 1_000_000_000 ? properties.timestamp : null));
}

function forecastPoint(value) {
  const latitude = Number(value?.latitude ?? 38.8895);
  const longitude = Number(value?.longitude ?? -77.0353);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 24 || latitude > 49 || longitude < -125 || longitude > -66) {
    throw new TypeError('Forecast point must be within the contiguous United States');
  }
  return { latitude: Math.round(latitude * 10_000) / 10_000, longitude: Math.round(longitude * 10_000) / 10_000 };
}

function satellitePosition(record, date) {
  const elements = json2satrec(record);
  const state = propagate(elements, date);
  if (!state.position || ![state.position.x, state.position.y, state.position.z].every(Number.isFinite)) return null;
  const location = eciToGeodetic(state.position, gstime(date));
  const coordinates = [degreesLong(location.longitude), degreesLat(location.latitude)];
  return coordinates.every(Number.isFinite) ? { coordinates, altitudeKm: Math.round(location.height) } : null;
}

function normalized(id, body, fetchedAt, location = null, predictedAt = fetchedAt, sourceUrl = null) {
  const cfg = SOURCES[id];
  const out = [];
  const push = (record) => { try { out.push(observation({ ...record, source: cfg.source, sourceUrl: sourceUrl || cfg.url, license: cfg.license, fetchedAt })); } catch {} };
  if (id === 'earthquakes' || id === 'weather') {
    if (!Array.isArray(body?.features)) throw new TypeError('Invalid GeoJSON feed');
    for (const f of body.features.slice(0, 500)) {
      const observedAt = timestamp(f.properties?.time || f.properties?.sent || f.properties?.effective);
      if (!observedAt) continue;
      push({ id: f.id, label: f.properties?.title || f.properties?.event || id,
        coordinates: point(f.geometry?.coordinates), observedAt,
        status: freshness(observedAt, fetchedAt, id === 'weather' ? 2 * 60 * 60_000 : 30 * 60_000), kind: id,
        properties: { detailUrl: f.properties?.url || null, severity: f.properties?.severity || null } });
    }
  } else if (id === 'events') {
    if (!Array.isArray(body?.events)) throw new TypeError('Invalid EONET feed');
    for (const e of body.events.slice(0, 100)) { const g = e.geometry?.at(-1); const observedAt = timestamp(g?.date); if (!observedAt) continue; push({ id: e.id, label: e.title,
      coordinates: point(g?.coordinates), observedAt, status: freshness(observedAt, fetchedAt, 24 * 60 * 60_000), kind: id,
      properties: { detailUrl: e.link || null, categories: e.categories?.map(c => c.title) || [] } }); }
  } else if (id === 'satellites') {
    if (!Array.isArray(body)) throw new TypeError('Invalid CelesTrak feed');
    for (const e of body.slice(0, 100)) {
      const observedAt = timestamp(e.EPOCH);
      if (!observedAt || Math.abs(Date.parse(fetchedAt) - Date.parse(observedAt)) > 14 * 24 * 60 * 60_000) continue;
      try {
        const predicted = satellitePosition(e, new Date(predictedAt));
        if (!predicted) continue;
        push({ id: e.NORAD_CAT_ID, label: e.OBJECT_NAME, coordinates: predicted.coordinates, observedAt,
          status: 'delayed', kind: id, properties: { noradId: e.NORAD_CAT_ID, positionType: 'SGP4 prediction', predictedAt,
            altitudeKm: predicted.altitudeKm, note: 'Predicted location from orbital elements; not a live observation' } });
      } catch { /* A bad element set cannot become a mapped prediction. */ }
    }
  } else if (id === 'maritime') {
    const items = Array.isArray(body?.features) ? body.features : Array.isArray(body) ? body : null;
    if (!items) throw new TypeError('Invalid AIS feed');
    const recent = items.map(e => ({ e, p: e.properties || e })).filter(({ p }) => aisTime(p))
      .sort((a, b) => Date.parse(aisTime(b.p)) - Date.parse(aisTime(a.p)));
    for (const { e, p } of recent.slice(0, 500)) { const observedAt = aisTime(p); push({ id: p.mmsi || e.id,
      label: `Vessel ${p.mmsi || e.id}`, coordinates: point(e.geometry?.coordinates || [p.longitude, p.latitude]),
      observedAt, status: freshness(observedAt, fetchedAt, 15 * 60_000), kind: id, properties: { mmsi: p.mmsi || null } }); }
  } else if (id === 'wind' || id === 'rain') {
    if (!Array.isArray(body?.properties?.periods)) throw new TypeError('Invalid NWS hourly forecast');
    const period = body.properties.periods.find(p => p.startTime && Date.parse(p.endTime) > Date.parse(fetchedAt));
    if (!period) return out;
    const value = id === 'wind' ? period.windSpeed : period.probabilityOfPrecipitation?.value;
    if (value == null) return out;
    const issuedAt = timestamp(body.properties.updateTime || body.properties.generatedAt || fetchedAt);
    push({ id: `${id}:${location.latitude}:${location.longitude}:${period.startTime}`, label: id === 'wind' ? `Wind ${value}` : `Rain chance ${value}%`,
      coordinates: [location.longitude, location.latitude], observedAt: issuedAt, status: 'forecast', kind: id,
      properties: { forecastValidFrom: period.startTime, forecastValidTo: period.endTime, value,
        windDirection: id === 'wind' ? period.windDirection : null, note: 'NWS forecast for selected point; not a measured observation' } });
  } else if (id === 'news') {
    if (!Array.isArray(body?.articles)) throw new TypeError('Invalid GDELT feed');
    for (const e of body.articles.slice(0, 25)) push({ id: e.url, label: e.title, observedAt: timestamp(e.seendate, fetchedAt),
      status: 'delayed', kind: id, properties: { detailUrl: e.url, sourceDomain: e.domain || null, note: 'Article metadata, not an event location' } });
  }
  return out;
}

async function boundedBody(response, limit = 4_000_000) {
  if (!response.body?.getReader) {
    const value = await response.text();
    if (Buffer.byteLength(value) > limit) throw new Error('Upstream response too large');
    return value;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('Upstream response too large');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  return Buffer.concat(chunks, size).toString('utf8');
}

export function createFeedService({ fetchImpl = fetch, now = () => Date.now() } = {}) {
  const cache = new Map();
  async function get(id, options = {}) {
    const cfg = SOURCES[id];
    if (!cfg) return { status: 'unavailable', observations: [], error: 'No approved live source', fetchedAt: null };
    const location = id === 'wind' || id === 'rain' ? forecastPoint(options) : null;
    const cacheKey = location ? `${id}:${location.latitude}:${location.longitude}` : id;
    const prior = cache.get(cacheKey);
    if (prior && now() < prior.expires) {
      if (id !== 'satellites' || !prior.body) return prior.value;
      const observations = normalized(id, prior.body, prior.value.fetchedAt, null, new Date(now()).toISOString());
      return { ...prior.value, observations, status: observations.length ? 'prediction' : 'unavailable' };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), id === 'news' ? 15_000 : 8000);
    try {
      const request = async (url, limit = 4_000_000) => {
        const response = await fetchImpl(url, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT, 'Digitraffic-User': 'Aetheris/1.0', Accept: 'application/json' }, redirect: 'error' });
        if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
        if (Number(response.headers?.get?.('content-length') || 0) > limit) throw new Error('Upstream response too large');
        return JSON.parse(await boundedBody(response, limit));
      };
      let url = cfg.url;
      if (location) {
        const pointData = await request(`${cfg.url}${location.latitude},${location.longitude}`);
        url = pointData?.properties?.forecastHourly;
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' || parsed.hostname !== 'api.weather.gov' || !/^\/gridpoints\/[A-Z]{3,4}\/\d+,\d+\/forecast\/hourly$/.test(parsed.pathname)) {
          throw new TypeError('NWS forecast link is not on the approved host and path');
        }
      }
      const body = await request(url, id === 'maritime' ? 16_000_000 : 4_000_000);
      const fetchedAt = new Date(now()).toISOString();
      const observations = normalized(id, body, fetchedAt, location, fetchedAt, url);
      const value = { status: observations.length ? location ? 'forecast' : id === 'satellites' ? 'prediction' : observations.some(o => o.status === 'live') ? 'live' : 'delayed' : 'unavailable', observations, fetchedAt, source: cfg.source,
        coverage: location ? `${cfg.coverage} (${location.latitude}, ${location.longitude})` : cfg.coverage, error: observations.length ? null : 'No valid observations' };
      cache.set(cacheKey, { value, body: id === 'satellites' ? body : null, expires: now() + cfg.ttl });
      return value;
    } catch (error) {
      const value = prior?.value?.observations?.length
        ? { ...prior.value, status: 'delayed', observations: prior.value.observations.map(o => ({ ...o, status: 'delayed' })), error: error.message }
        : { status: 'unavailable', observations: [], fetchedAt: null, source: cfg.source, coverage: cfg.coverage, error: error.message };
      cache.set(cacheKey, { value, expires: now() + 60_000 });
      return value;
    } finally { clearTimeout(timeout); }
  }
  return { get, ids: Object.keys(SOURCES) };
}
