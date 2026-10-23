import { createHash } from 'node:crypto';

export const DATA_STATES = Object.freeze(['live', 'delayed', 'static', 'synthetic', 'unavailable']);

export function observation({ source, sourceUrl, license, id, label, coordinates = null, observedAt, fetchedAt, status, kind, properties = {} }) {
  if (!DATA_STATES.includes(status)) throw new TypeError('Invalid observation status');
  if (!source || !sourceUrl || !license || !kind) throw new TypeError('Observation provenance is required');
  if (coordinates !== null && (!Array.isArray(coordinates) || coordinates.length < 2 ||
    !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1]) ||
    Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90)) {
    throw new TypeError('Invalid WGS84 point');
  }
  const time = Date.parse(observedAt);
  if (!Number.isFinite(time)) throw new TypeError('Invalid observation time');
  const key = String(id || createHash('sha256').update(`${source}:${label}:${observedAt}`).digest('hex').slice(0, 20));
  return { schemaVersion: 1, id: `${source}:${key}`, kind, label: String(label).slice(0, 240),
    geometry: coordinates ? { type: 'Point', coordinates: coordinates.slice(0, 2) } : null,
    observedAt: new Date(time).toISOString(), fetchedAt: new Date(fetchedAt).toISOString(),
    source: { id: source, url: sourceUrl, license }, status, properties };
}

export function publicImport(payload, now = new Date()) {
  if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) throw new TypeError('Expected GeoJSON FeatureCollection');
  if (payload.features.length > 500) throw new RangeError('Maximum 500 observations');
  return payload.features.map((feature, index) => {
    const p = feature?.properties || {};
    if (feature?.type !== 'Feature' || feature.geometry?.type !== 'Point') throw new TypeError(`Feature ${index + 1} must be a Point`);
    if (!['public', 'permissioned', 'synthetic'].includes(p.dataClass)) throw new TypeError(`Feature ${index + 1} needs dataClass`);
    if (!p.source || !p.sourceUrl || !p.license || !p.observedAt) throw new TypeError(`Feature ${index + 1} lacks provenance`);
    const observed = Date.parse(p.observedAt);
    if (!Number.isFinite(observed) || observed > now.getTime() + 60_000) throw new TypeError(`Feature ${index + 1} has invalid time`);
    const importedId = createHash('sha256').update(JSON.stringify([p.sourceUrl, feature.id ?? p.id ?? index, p.observedAt, feature.geometry.coordinates])).digest('hex').slice(0, 32);
    return observation({ source: 'import', sourceUrl: p.sourceUrl, license: p.license,
      id: importedId, label: p.label || p.name || `Observation ${index + 1}`,
      coordinates: feature.geometry.coordinates, observedAt: p.observedAt, fetchedAt: now.toISOString(),
      status: p.dataClass === 'synthetic' ? 'synthetic' : 'static',
      kind: String(p.kind || 'import').slice(0, 64), properties: { dataClass: p.dataClass, declaredSource: String(p.source).slice(0, 160), result: p.result ?? null } });
  });
}
