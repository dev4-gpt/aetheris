import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildServer } from '../src/server.js';
import { createFeedService } from '../src/feeds.js';
import { createStore } from '../src/store.js';
import { publicImport } from '../src/observations.js';
import { projectGlobe, unprojectGlobe, solarPosition, sunlit } from '../public/globeProjection.js';

const ADMIN_PASSWORD = 'test-admin-password-very-long';
const now = () => new Date().toISOString();
function response(body, status = 200) { return { ok: status === 200, status, headers: { get: () => null }, text: async () => JSON.stringify(body), json: async () => body }; }
function fakeFetch(url) {
  if (url.includes('epqs.nationalmap.gov')) return Promise.resolve(response({ value: '125.4' }));
  if (url.includes('earthquake.usgs.gov')) return Promise.resolve(response({ features: [{ type: 'Feature', id: 'eq1', geometry: { type: 'Point', coordinates: [-77, 38] }, properties: { title: 'Test earthquake', time: Date.now(), url: 'https://earthquake.usgs.gov' } }] }));
  if (url.includes('eonet.gsfc.nasa.gov')) return Promise.resolve(response({ events: [{ id: 'e1', title: 'Test storm', link: 'https://eonet.gsfc.nasa.gov', geometry: [{ date: now(), coordinates: [-75, 38] }] }] }));
  if (url.includes('api.weather.gov')) return Promise.resolve(response({ features: [{ type: 'Feature', id: 'w1', geometry: { type: 'Point', coordinates: [-77, 39] }, properties: { event: 'Test alert', sent: now() } }] }));
  if (url.includes('celestrak.org')) return Promise.resolve(response([{ NORAD_CAT_ID: 25544, OBJECT_NAME: 'ISS', EPOCH: now() }]));
  if (url.includes('digitraffic.fi')) return Promise.resolve(response({ features: [{ id: 'v1', geometry: { coordinates: [24.9, 60.1] }, properties: { mmsi: 123456789, timestamp: Math.floor(Date.now() / 1000) } }] }));
  if (url.includes('gdeltproject.org')) return Promise.resolve(response({ articles: [{ url: 'https://example.org/news', title: 'Test news', seendate: now() }] }));
  throw new Error('Unexpected URL');
}

describe('pilot gateway', () => {
  let app, cookie, csrf;
  before(async () => {
    app = await buildServer({ adminPassword: ADMIN_PASSWORD, fetchImpl: fakeFetch, logger: false, secureCookies: false });
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { username: 'admin', password: ADMIN_PASSWORD } });
    assert.equal(login.statusCode, 200);
    cookie = login.headers['set-cookie'].split(';')[0];
    csrf = login.json().csrf;
  });
  after(async () => app.close());
  const auth = () => ({ cookie });

  test('health is public, records are protected, and no wildcard CORS is sent', async () => {
    assert.equal((await app.inject('/api/v1/health')).statusCode, 200);
    assert.equal((await app.inject('/api/v1/layers')).statusCode, 401);
    const result = await app.inject({ url: '/api/v1/layers', headers: auth() });
    assert.equal(result.statusCode, 200);
    assert.equal(result.headers['access-control-allow-origin'], undefined);
    assert.ok(result.json().layers.some(layer => layer.id === 'flights'));
    const page = await app.inject('/');
    assert.equal(page.statusCode, 200);
    assert.match(page.body, /id="globeView"/);
    assert.match(page.body, /id="flatView"/);
    assert.match(page.body, /id="lightTheme"/);
    assert.equal((await app.inject('/globeProjection.js')).statusCode, 200);
  });

  test('real adapters preserve source, time, rights, and coverage', async () => {
    for (const id of ['earthquakes', 'events', 'weather', 'satellites', 'maritime', 'news']) {
      const result = await app.inject({ url: `/api/v1/feeds/${id}`, headers: auth() });
      assert.equal(result.statusCode, 200);
      const body = result.json();
      assert.equal(body.observations.length, 1, id);
      assert.equal(body.observations[0].schemaVersion, 1);
      assert.ok(body.observations[0].source.license);
      assert.ok(body.observations[0].observedAt);
    }
    const flights = (await app.inject({ url: '/api/v1/feeds/flights', headers: auth() })).json();
    assert.equal(flights.status, 'unavailable');
    assert.deepEqual(flights.observations, []);
    assert.equal((await app.inject({ url: '/api/opensky', headers: auth() })).statusCode, 410);
  });

  test('CSRF and roles protect mutations', async () => {
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/scenes', headers: auth(), payload: { latitude: 38.88, longitude: -77.03, radiusKm: 1 } })).statusCode, 403);
    const created = await app.inject({ method: 'POST', url: '/api/v1/admin/users', headers: { ...auth(), 'x-csrf-token': csrf }, payload: { username: 'viewer1', password: 'a-long-viewer-password', role: 'viewer' } });
    assert.equal(created.statusCode, 201);
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { username: 'viewer1', password: 'a-long-viewer-password' } });
    const viewer = login.headers['set-cookie'].split(';')[0];
    const forbidden = await app.inject({ method: 'POST', url: '/api/v1/scenes', headers: { cookie: viewer, 'x-csrf-token': login.json().csrf }, payload: { latitude: 38.88, longitude: -77.03, radiusKm: 1 } });
    assert.equal(forbidden.statusCode, 403);
  });

  test('grounded scene, import, decision, replay and export work', async () => {
    const headers = { ...auth(), 'x-csrf-token': csrf };
    const sceneResponse = await app.inject({ method: 'POST', url: '/api/v1/scenes', headers, payload: { latitude: 38.8895, longitude: -77.0353, radiusKm: 1 } });
    assert.equal(sceneResponse.statusCode, 201);
    const scene = sceneResponse.json(); assert.equal(scene.terrain.points.length, 25); assert.deepEqual(scene.generatedAssets, []);
    const importResponse = await app.inject({ method: 'POST', url: '/api/v1/observations/import', headers, payload: { type: 'FeatureCollection', features: [{ type: 'Feature', id: 'local-1', geometry: { type: 'Point', coordinates: [-77, 38] }, properties: { label: 'Access road', source: 'operator file', sourceUrl: 'https://example.org/source', license: 'permissioned', dataClass: 'permissioned', observedAt: now() } }] } });
    assert.equal(importResponse.statusCode, 201);
    const observations = importResponse.json().observations;
    assert.equal(observations[0].status, 'static');
    const importedOnly = (await app.inject({ url: '/api/v1/observations/imported', headers: auth() })).json().observations;
    assert.ok(importedOnly.every(item => item.source.id === 'import'));
    const saved = await app.inject({ method: 'POST', url: '/api/v1/decisions', headers, payload: { title: 'Access review', note: 'Human review required', sceneId: scene.id, observationIds: observations.map(item => item.id) } });
    assert.equal(saved.statusCode, 201);
    const id = saved.json().id;
    assert.equal((await app.inject({ url: `/api/v1/decisions/${id}`, headers: auth() })).json().observations[0].id, observations[0].id);
    const exported = await app.inject({ url: `/api/v1/decisions/${id}/export`, headers: auth() });
    assert.match(exported.headers['content-disposition'], /attachment/);
  });

  test('invalid scene and import fail closed', async () => {
    const headers = { ...auth(), 'x-csrf-token': csrf };
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/scenes', headers, payload: { latitude: 0, longitude: 0, radiusKm: 10 } })).statusCode, 400);
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/observations/import', headers, payload: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }] } })).statusCode, 400);
  });
});

test('import IDs include provenance and declared imports never claim live status', () => {
  const feature = sourceUrl => ({ type: 'Feature', id: 'shared-id', geometry: { type: 'Point', coordinates: [-77, 38] },
    properties: { label: 'Road', source: 'operator', sourceUrl, license: 'permissioned', dataClass: 'permissioned', observedAt: now() } });
  const [one, two] = publicImport({ type: 'FeatureCollection', features: [feature('https://example.org/a'), feature('https://example.org/b')] });
  assert.notEqual(one.id, two.id);
  assert.equal(one.status, 'static');
  assert.equal(two.status, 'static');
});

test('feed body without Content-Length is bounded before parsing', async () => {
  const bytes = new Uint8Array(4_000_001);
  const service = createFeedService({ fetchImpl: async () => ({ ok: true, headers: { get: () => null },
    body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
    text: async () => { throw new Error('Unbounded read'); } }) });
  const result = await service.get('earthquakes');
  assert.equal(result.status, 'unavailable');
  assert.match(result.error, /too large/);
});

test('globe projection keeps observations on the correct hemisphere', () => {
  const center = projectGlobe([-77, 39], -77, 39);
  assert.ok(Math.abs(center.x) < 1e-12 && Math.abs(center.y) < 1e-12);
  assert.ok(center.depth > .999);
  assert.ok(projectGlobe([103, -39], -77, 39).depth < 0);
  const coordinate = unprojectGlobe(center.x, center.y, -77, 39);
  assert.ok(Math.abs(coordinate[0] + 77) < 1e-10 && Math.abs(coordinate[1] - 39) < 1e-10);
  assert.equal(unprojectGlobe(1.01, 0, 0, 0), null);
  const sun = solarPosition(new Date('2026-03-20T12:00:00Z'));
  assert.ok(sunlit(sun.longitude, sun.latitude, sun) > .99);
  assert.ok(sunlit(sun.longitude + 180, -sun.latitude, sun) < -.99);
});

test('outage and rate limit never become fake live data; stale cache is labeled delayed', async () => {
  let time = Date.now(), calls = 0;
  const service = createFeedService({ now: () => time, fetchImpl: async () => { calls++; if (calls > 1) return response({}, 429); return response({ features: [{ id: 'eq1', geometry: { type: 'Point', coordinates: [-77, 38] }, properties: { title: 'Quake', time } }] }); } });
  assert.equal((await service.get('earthquakes')).status, 'live');
  time += 61_000;
  const stale = await service.get('earthquakes');
  assert.equal(stale.status, 'delayed'); assert.equal(stale.observations[0].status, 'delayed');
  assert.equal((await service.get('flights')).status, 'unavailable');
});

test('database backup can restore a decision record', async () => {
  const folder = mkdtempSync(path.join(os.tmpdir(), 'aetheris-store-'));
  const source = path.join(folder, 'source.db'), destination = path.join(folder, 'backup.db');
  try {
    const store = createStore({ filename: source, adminPassword: ADMIN_PASSWORD });
    store.saveDecision({ id: 'restore-test', value: 'persisted' });
    await store.writeBackup(destination); store.close();
    const restored = createStore({ filename: destination, adminPassword: ADMIN_PASSWORD });
    assert.equal(restored.decision('restore-test').value, 'persisted'); restored.close();
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
