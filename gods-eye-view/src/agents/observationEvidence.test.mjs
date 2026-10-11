import test from 'node:test';
import assert from 'node:assert/strict';
import { createSampleObservationFeed, reviewObservationFeed } from './observationEvidence.js';

const NOW = Date.parse('2026-10-11T12:00:00Z');

test('sample observations remain explicitly synthetic even with recent timestamps', () => {
  const report = reviewObservationFeed(createSampleObservationFeed(NOW), { now: NOW });
  assert.equal(report.records.length, 3);
  assert.deepEqual(report.counts, { RECENT: 0, STALE: 0, REVIEW: 0, SYNTHETIC: 3 });
  assert.deepEqual(report.records[0].coordinates, [-97.7431, 30.2672]);
});

test('imported GeoJSON records distinguish recent, stale, and incomplete evidence', () => {
  const makeFeature = (id, properties) => ({
    type: 'Feature', id, geometry: { type: 'Point', coordinates: [-97, 30] }, properties
  });
  const common = { source: 'Local test feed', license: 'CC-BY-4.0', dataClass: 'public' };
  const report = reviewObservationFeed({ type: 'FeatureCollection', features: [
    makeFeature('recent', { ...common, observedAt: '2026-10-11T11:45:00Z' }),
    makeFeature('stale', { ...common, observedAt: '2026-10-11T10:00:00Z' }),
    makeFeature('unlicensed', { ...common, license: '', observedAt: '2026-10-11T11:58:00Z' })
  ] }, { now: NOW });
  assert.deepEqual(report.counts, { RECENT: 1, STALE: 1, REVIEW: 1, SYNTHETIC: 0 });
  assert.match(report.records[2].reason, /license/);
});

test('SensorThings observations map phenomenon and result time without inventing provenance', () => {
  const report = reviewObservationFeed({ value: [{
    '@iot.id': 7,
    phenomenonTime: '2026-10-11T11:55:00Z',
    resultTime: '2026-10-11T11:56:00Z',
    result: 22,
    Datastream: { name: 'Temperature', unitOfMeasurement: { symbol: 'C' } },
    FeatureOfInterest: { feature: { type: 'Point', coordinates: [-97, 30] } }
  }] }, { now: NOW });
  assert.equal(report.format, 'OGC SensorThings Observation collection');
  assert.equal(report.records[0].resultTime, '2026-10-11T11:56:00Z');
  assert.equal(report.records[0].status, 'REVIEW');
  assert.match(report.records[0].reason, /source/);
});

test('rejects malformed coordinates and oversized files before producing a report', () => {
  const feature = { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 30] }, properties: {} };
  assert.throws(() => reviewObservationFeed({ type: 'FeatureCollection', features: [feature] }, { now: NOW }), /invalid WGS84/);
  assert.throws(() => reviewObservationFeed({ type: 'FeatureCollection', features: Array(501).fill(feature) }, { now: NOW }), /exceeds 500/);
});
