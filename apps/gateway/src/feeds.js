import { observation } from './observations.js';

const USER_AGENT = 'AetherisPilot/1.0 (public-data planning; source links in application)';
const SOURCES = Object.freeze({
  earthquakes: { url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', source: 'usgs', license: 'US public domain; credit USGS', ttl: 60_000, coverage: 'Global reported events' },
  events: { url: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100', source: 'nasa-eonet', license: 'NASA EONET public event metadata; inspect linked imagery rights', ttl: 5 * 60_000, coverage: 'Global curated events' },
  weather: { url: 'https://api.weather.gov/alerts/active', source: 'nws', license: 'US public domain; credit NOAA/NWS', ttl: 2 * 60_000, coverage: 'United States alerts' },
  satellites: { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json', source: 'celestrak', license: 'CelesTrak GP usage policy; credit CelesTrak', ttl: 2 * 60 * 60_000, coverage: 'Orbital elements; positions are predictions' },
  maritime: { url: 'https://meri.digitraffic.fi/api/ais/v1/locations', source: 'fintraffic', license: 'CC BY 4.0; credit Fintraffic / digitraffic.fi', ttl: 60_000, coverage: 'Finnish waterways' },
  news: { url: 'https://api.gdeltproject.org/api/v2/doc/doc?query=earthquake%20OR%20wildfire%20OR%20flood&mode=artlist&format=json&maxrecords=25', source: 'gdelt', license: 'Free commercial use with GDELT attribution; linked articles retain publisher rights', ttl: 10 * 60_000, coverage: 'Global indexed reports; locations are not verified event positions' }
});

export const LAYERS = Object.freeze([
  ...Object.entries(SOURCES).map(([id, s]) => ({ id, title: id[0].toUpperCase() + id.slice(1), source: s.source, sourceUrl: s.url, license: s.license, coverage: s.coverage, mode: 'feed' })),
  { id: 'flights', title: 'Flights', source: null, coverage: 'Pending production source permission', mode: 'permission-gated' },
  { id: 'cctv', title: 'CCTV', source: null, coverage: 'Operator metadata and external links only', mode: 'permission-gated' },
  { id: 'cables', title: 'Cables', source: null, coverage: 'Static geography, pending data review', mode: 'static' },
  { id: 'day-night', title: 'Day and night', source: 'local computation', coverage: 'Global', mode: 'computed' },
  { id: 'wind', title: 'Wind', source: 'nws', coverage: 'United States forecasts', mode: 'forecast' },
  { id: 'rain', title: 'Rain', source: 'nws', coverage: 'United States forecasts', mode: 'forecast' },
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
  return Date.parse(fetchedAt) - Date.parse(observedAt) <= maxAgeMs ? 'live' : 'delayed';
}

function normalized(id, body, fetchedAt) {
  const cfg = SOURCES[id];
  const out = [];
  const push = (record) => { try { out.push(observation({ ...record, source: cfg.source, sourceUrl: cfg.url, license: cfg.license, fetchedAt })); } catch {} };
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
    for (const e of body.slice(0, 100)) push({ id: e.NORAD_CAT_ID, label: e.OBJECT_NAME, observedAt: timestamp(e.EPOCH),
      status: 'delayed', kind: id, properties: { noradId: e.NORAD_CAT_ID, note: 'Orbital elements, not an observed position' } });
  } else if (id === 'maritime') {
    const items = Array.isArray(body?.features) ? body.features : Array.isArray(body) ? body : null;
    if (!items) throw new TypeError('Invalid AIS feed');
    for (const e of items.slice(0, 500)) { const p = e.properties || e; push({ id: p.mmsi || e.id,
      label: `Vessel ${p.mmsi || e.id}`, coordinates: point(e.geometry?.coordinates || [p.longitude, p.latitude]),
      observedAt: timestamp(p.timestamp || p.time || p.updated), status: freshness(timestamp(p.timestamp || p.time || p.updated), fetchedAt, 15 * 60_000), kind: id, properties: { mmsi: p.mmsi || null } }); }
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
  async function get(id) {
    const cfg = SOURCES[id];
    if (!cfg) return { status: 'unavailable', observations: [], error: 'No approved live source', fetchedAt: null };
    const prior = cache.get(id);
    if (prior && now() < prior.expires) return prior.value;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetchImpl(cfg.url, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, redirect: 'error' });
      if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
      const size = Number(response.headers?.get?.('content-length') || 0);
      if (size > 4_000_000) throw new Error('Upstream response too large');
      const raw = await boundedBody(response);
      const fetchedAt = new Date(now()).toISOString();
      const observations = normalized(id, JSON.parse(raw), fetchedAt);
      const value = { status: observations.length ? observations.some(o => o.status === 'live') ? 'live' : 'delayed' : 'unavailable', observations, fetchedAt, source: cfg.source, coverage: cfg.coverage, error: observations.length ? null : 'No valid observations' };
      cache.set(id, { value, expires: now() + cfg.ttl });
      return value;
    } catch (error) {
      const value = prior?.value?.observations?.length
        ? { ...prior.value, status: 'delayed', observations: prior.value.observations.map(o => ({ ...o, status: 'delayed' })), error: error.message }
        : { status: 'unavailable', observations: [], fetchedAt: null, source: cfg.source, coverage: cfg.coverage, error: error.message };
      cache.set(id, { value, expires: now() + 60_000 });
      return value;
    } finally { clearTimeout(timeout); }
  }
  return { get, ids: Object.keys(SOURCES) };
}
