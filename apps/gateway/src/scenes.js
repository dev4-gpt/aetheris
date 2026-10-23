import { randomUUID } from 'node:crypto';

const EPQS = 'https://epqs.nationalmap.gov/v1/json';
const EPQS_RIGHTS = 'US public domain; credit U.S. Geological Survey, National Geospatial Program';

export function validateArea({ latitude, longitude, radiusKm } = {}) {
  const lat = Number(latitude), lon = Number(longitude), radius = Number(radiusKm);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 24 || lat > 49 || lon < -125 || lon > -66 ||
      !Number.isFinite(radius) || radius < 0.2 || radius > 5) throw new TypeError('Area must be in the contiguous U.S. with radius 0.2–5 km');
  return { latitude: lat, longitude: lon, radiusKm: radius };
}

export function createSceneService({ fetchImpl = fetch, now = () => Date.now() } = {}) {
  const cache = new Map();
  async function elevation(lat, lon) {
    const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    const prior = cache.get(key);
    if (prior && now() - prior.at < 24 * 60 * 60_000) return prior.value;
    const url = `${EPQS}?x=${lon.toFixed(6)}&y=${lat.toFixed(6)}&wkid=4326&units=Meters&includeDate=false`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetchImpl(url, { signal: controller.signal, redirect: 'error' });
      if (!response.ok) throw new Error(`USGS elevation HTTP ${response.status}`);
      const body = await response.json();
      const value = Number(body.value);
      if (!Number.isFinite(value) || value < -500 || value > 9000) throw new Error('Invalid USGS elevation');
      cache.set(key, { at: now(), value });
      return value;
    } finally { clearTimeout(timeout); }
  }
  async function create(input) {
    const area = validateArea(input);
    const deltaLat = area.radiusKm / 111.2;
    const deltaLon = area.radiusKm / (111.2 * Math.cos(area.latitude * Math.PI / 180));
    const points = [];
    // Bounded 5x5 EPQS query. Run in small groups to respect the public service.
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const latitude = area.latitude + ((row - 2) / 2) * deltaLat;
        const longitude = area.longitude + ((col - 2) / 2) * deltaLon;
        points.push({ latitude, longitude });
      }
    }
    for (let offset = 0; offset < points.length; offset += 3) {
      const batch = points.slice(offset, offset + 3);
      const heights = await Promise.all(batch.map(p => elevation(p.latitude, p.longitude)));
      batch.forEach((p, index) => { p.heightMeters = heights[index]; });
    }
    const elevations = points.map(p => p.heightMeters);
    const min = Math.min(...elevations), max = Math.max(...elevations);
    const illustrative = input?.includeIllustrativeAssets === true;
    const generatedAssets = illustrative ? [6, 8, 12, 16, 18].map((index, sequence) => ({
      id: `marker-${sequence + 1}`, type: 'planning-marker', status: 'synthetic', gridIndex: index,
      geometry: { type: 'Point', coordinates: [points[index].longitude, points[index].latitude, points[index].heightMeters] },
      source: 'deterministic procedural placement', note: 'Illustrative object; not a mapped structure or observation.'
    })) : [];
    const scene = {
      schemaVersion: 1, id: randomUUID(), createdAt: new Date(now()).toISOString(), area,
      scenePlan: { method: 'structured plan → region-aware terrain → optional local detail → review',
        intent: 'Unclassified area review', detailMode: illustrative ? 'illustrative markers' : 'none',
        sourceSeparation: 'USGS elevation and synthetic detail are separate layers' },
      terrain: { gridSize: 5, points, datum: 'USGS EPQS meters', type: 'interpolated 3DEP elevation', sourceUrl: EPQS,
        license: EPQS_RIGHTS, observedAt: null, fetchedAt: new Date(now()).toISOString(),
        limitation: 'Interpolated service values; not a surveyed surface or engineering-grade elevation.' },
      regions: [{ id: 'low', label: 'Lower terrain', rule: `elevation < ${(min + max) / 2} m` },
        { id: 'high', label: 'Higher terrain', rule: `elevation >= ${(min + max) / 2} m` }],
      generatedAssets,
      review: { complete: true, sampleCount: points.length, minHeightMeters: min, maxHeightMeters: max,
        checks: ['25 finite elevation values', 'bounded U.S. area', 'generated assets separate from terrain'] }
    };
    return scene;
  }
  return { create };
}
