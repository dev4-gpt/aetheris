/** Local, read-only observation review for the base-resilience demo. */

const MAX_RECORDS = 500;
const FRESH_WINDOW_MS = 30 * 60 * 1000;

function pointCoordinates(point, index) {
  if (point?.type !== 'Point' || !Array.isArray(point.coordinates) || point.coordinates.length < 2) {
    throw new TypeError(`Observation ${index + 1} must have a GeoJSON Point`);
  }
  const [lon, lat] = point.coordinates;
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
    throw new RangeError(`Observation ${index + 1} has invalid WGS84 coordinates`);
  }
  return [lon, lat];
}

function qualityFor(record, now) {
  const missing = [];
  if (!record.source) missing.push('source');
  if (!record.license) missing.push('license');
  if (!['public', 'permissioned', 'synthetic'].includes(record.dataClass)) missing.push('data class');
  const observedMs = typeof record.observedAt === 'string' ? Date.parse(record.observedAt) : Number.NaN;
  if (!Number.isFinite(observedMs)) missing.push('observation time');
  if (missing.length) return { status: 'REVIEW', reason: `Missing or invalid ${missing.join(', ')}` };
  if (record.dataClass === 'synthetic') return { status: 'SYNTHETIC', reason: 'Scenario data' };
  if (observedMs > now + 60_000) return { status: 'REVIEW', reason: 'Observation time is in the future' };
  if (now - observedMs > FRESH_WINDOW_MS) return { status: 'STALE', reason: 'Older than 30 minutes' };
  return { status: 'RECENT', reason: 'Recent by timestamp; source is user-declared' };
}

function normalizeGeoJson(payload) {
  if (!Array.isArray(payload.features)) throw new TypeError('GeoJSON features must be an array');
  return payload.features.map((feature, index) => {
    if (feature?.type !== 'Feature') throw new TypeError(`Observation ${index + 1} must be a GeoJSON Feature`);
    const p = feature.properties || {};
    return {
      id: String(feature.id ?? p.id ?? `feature-${index + 1}`),
      label: String(p.label ?? p.name ?? `Observation ${index + 1}`),
      coordinates: pointCoordinates(feature.geometry, index),
      observedAt: p.observedAt ?? p.datetime ?? null,
      resultTime: p.resultTime ?? null,
      source: String(p.source ?? ''),
      license: String(p.license ?? ''),
      dataClass: String(p.dataClass ?? ''),
      result: p.result ?? null,
      unit: String(p.unit ?? '')
    };
  });
}

function normalizeSensorThings(payload) {
  const list = payload.value;
  if (!Array.isArray(list)) throw new TypeError('SensorThings value must be an array');
  return list.map((item, index) => {
    const feature = item?.FeatureOfInterest?.feature;
    const p = item?.properties || {};
    return {
      id: String(item?.['@iot.id'] ?? `observation-${index + 1}`),
      label: String(item?.Datastream?.name ?? `Observation ${index + 1}`),
      coordinates: pointCoordinates(feature, index),
      observedAt: item?.phenomenonTime ?? null,
      resultTime: item?.resultTime ?? null,
      source: String(p.source ?? payload.source ?? ''),
      license: String(p.license ?? payload.license ?? ''),
      dataClass: String(p.dataClass ?? payload.dataClass ?? ''),
      result: item?.result ?? null,
      unit: String(item?.Datastream?.unitOfMeasurement?.symbol ?? '')
    };
  });
}

export function reviewObservationFeed(payload, { now = Date.now() } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Observation file must contain a JSON object');
  }
  if (!Number.isFinite(now)) throw new TypeError('now must be a finite timestamp');
  const format = payload.type === 'FeatureCollection' ? 'GeoJSON FeatureCollection'
    : Array.isArray(payload.value) ? 'OGC SensorThings Observation collection'
      : null;
  if (!format) throw new TypeError('Expected a GeoJSON FeatureCollection or SensorThings value array');
  if (format === 'GeoJSON FeatureCollection' && !Array.isArray(payload.features)) {
    throw new TypeError('GeoJSON features must be an array');
  }
  const inputCount = format === 'GeoJSON FeatureCollection' ? payload.features.length : payload.value.length;
  if (inputCount > MAX_RECORDS) throw new RangeError(`Observation file exceeds ${MAX_RECORDS} records`);

  const records = (format === 'GeoJSON FeatureCollection' ? normalizeGeoJson(payload) : normalizeSensorThings(payload))
    .map(record => ({ ...record, ...qualityFor(record, now) }));
  const counts = { RECENT: 0, STALE: 0, REVIEW: 0, SYNTHETIC: 0 };
  for (const record of records) counts[record.status]++;
  return {
    format,
    reviewedAt: new Date(now).toISOString(),
    counts,
    records,
    limitations: 'Timestamps, source, and license are declared by the file; this review does not authenticate them or certify data rights.'
  };
}

export function createSampleObservationFeed(now = Date.now()) {
  const observedAt = new Date(now - 4 * 60_000).toISOString();
  const sample = [
    ['Power availability', [-97.7431, 30.2672], 'Nominal'],
    ['Road access', [-97.7471, 30.2688], 'Open'],
    ['Weather station', [-97.7382, 30.2650], '22 C']
  ];
  return {
    type: 'FeatureCollection',
    features: sample.map(([label, coordinates, result], index) => ({
      type: 'Feature',
      id: `demo-${index + 1}`,
      geometry: { type: 'Point', coordinates },
      properties: { label, result, source: 'Aetheris sample fixture', license: 'Sample data only', dataClass: 'synthetic', observedAt }
    }))
  };
}
