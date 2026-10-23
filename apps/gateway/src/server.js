import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createFeedService, LAYERS } from './feeds.js';
import { publicImport } from './observations.js';
import { createSceneService } from './scenes.js';
import { createStore } from './store.js';

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const WORLD_REGIONS = path.resolve(PUBLIC, '../../../gods-eye-view/src/data/local_data/natural_earth/regions.json');
const STATIC = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'] };
const writes = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const cookieToken = request => /(?:^|;\s*)aetheris_session=([^;]+)/.exec(request.headers.cookie || '')?.[1] || null;

export async function buildServer(options = {}) {
  const store = options.store || createStore({ filename: options.dbPath ?? process.env.AETHERIS_DB_PATH ?? ':memory:', adminPassword: options.adminPassword ?? process.env.AETHERIS_ADMIN_PASSWORD });
  const feeds = createFeedService({ fetchImpl: options.fetchImpl });
  const scenes = createSceneService({ fetchImpl: options.fetchImpl });
  const secureCookies = options.secureCookies ?? process.env.NODE_ENV === 'production';
  const app = Fastify({ logger: options.logger ?? true, bodyLimit: 1_048_576, trustProxy: false });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(websocket);
  app.addHook('onClose', async () => store.close());
  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'");
    if (secureCookies) reply.header('Strict-Transport-Security', 'max-age=31536000');
    if (!request.url.startsWith('/api/') && !request.url.startsWith('/ws/')) return;
    if (request.url === '/api/v1/auth/login' || request.url === '/api/v1/health') return;
    const current = store.session(cookieToken(request));
    if (!current) return reply.code(401).send({ error: 'Authentication required' });
    request.user = current;
    if (writes.has(request.method) && request.headers['x-csrf-token'] !== current.csrf) return reply.code(403).send({ error: 'CSRF token required' });
  });

  app.get('/api/v1/health', async () => ({ status: 'ok', service: 'aetheris-pilot', timestamp: new Date().toISOString() }));
  app.post('/api/v1/auth/login', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {
    const result = store.login(String(request.body?.username || ''), String(request.body?.password || ''));
    if (!result) return reply.code(401).send({ error: 'Invalid credentials' });
    reply.header('Set-Cookie', `aetheris_session=${result.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secureCookies ? '; Secure' : ''}`);
    return { username: result.username, role: result.role, csrf: result.csrf, expiresAt: result.expiresAt };
  });
  app.get('/api/v1/auth/session', async request => ({ username: request.user.username, role: request.user.role, csrf: request.user.csrf, expiresAt: request.user.expires_at }));
  app.post('/api/v1/auth/logout', async (request, reply) => {
    store.logout(cookieToken(request)); store.audit(request.user.username, 'logout');
    reply.header('Set-Cookie', `aetheris_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookies ? '; Secure' : ''}`);
    return { ok: true };
  });
  app.post('/api/v1/admin/users', async (request, reply) => {
    if (request.user.role !== 'admin') return reply.code(403).send({ error: 'Admin only' });
    try { store.addUser(request.body?.username, request.body?.password, request.body?.role); return reply.code(201).send({ ok: true }); }
    catch (error) { return reply.code(400).send({ error: error.message }); }
  });
  app.get('/api/v1/layers', async () => ({ schemaVersion: 1, layers: LAYERS }));
  app.get('/api/v1/feeds/:id', async (request, reply) => {
    if (!LAYERS.some(layer => layer.id === request.params.id)) return reply.code(404).send({ error: 'Unknown layer' });
    const result = await feeds.get(request.params.id);
    for (const item of result.observations) store.saveObservation(item);
    return { schemaVersion: 1, layerId: request.params.id, ...result };
  });
  app.post('/api/v1/observations/import', async (request, reply) => {
    if (request.user.role === 'viewer') return reply.code(403).send({ error: 'Operator role required' });
    try {
      const observations = publicImport(request.body);
      for (const item of observations) store.saveObservation(item);
      store.audit(request.user.username, 'observations.import', `${observations.length} records`);
      return reply.code(201).send({ schemaVersion: 1, observations, note: 'Imported source and rights are user declared and unverified.' });
    } catch (error) { return reply.code(400).send({ error: error.message }); }
  });
  app.get('/api/v1/observations/imported', async () => ({ schemaVersion: 1, observations: store.observations() }));
  app.post('/api/v1/scenes', async (request, reply) => {
    if (request.user.role === 'viewer') return reply.code(403).send({ error: 'Operator role required' });
    try { const scene = await scenes.create(request.body); store.saveScene(scene); store.audit(request.user.username, 'scene.create', scene.id); return reply.code(201).send(scene); }
    catch (error) { return reply.code(error instanceof TypeError ? 400 : 503).send({ error: error.message }); }
  });
  app.post('/api/v1/decisions', async (request, reply) => {
    if (request.user.role === 'viewer') return reply.code(403).send({ error: 'Operator role required' });
    const { title, note, sceneId, observationIds } = request.body || {};
    if (typeof title !== 'string' || title.length < 3 || title.length > 160 || typeof note !== 'string' || note.length > 5000 ||
        typeof sceneId !== 'string' || !Array.isArray(observationIds) || observationIds.length > 50 ||
        observationIds.some(id => typeof id !== 'string')) return reply.code(400).send({ error: 'Invalid decision record' });
    const scene = store.scene(sceneId);
    const observations = observationIds.map(id => store.observation(id));
    if (!scene || observations.some(item => !item)) return reply.code(400).send({ error: 'Scene or observation is not in server evidence store' });
    const record = { schemaVersion: 1, id: randomUUID(), title, note, scene, observations, createdAt: new Date().toISOString(),
      actor: request.user.username, limitation: 'Planning record for human review. Generated content and observations have different evidentiary status.' };
    store.saveDecision(record); store.audit(request.user.username, 'decision.create', record.id);
    return reply.code(201).send(record);
  });
  app.get('/api/v1/decisions', async () => ({ schemaVersion: 1, decisions: store.decisions() }));
  app.get('/api/v1/decisions/:id', async (request, reply) => store.decision(request.params.id) || reply.code(404).send({ error: 'Decision not found' }));
  app.get('/api/v1/decisions/:id/export', async (request, reply) => {
    const item = store.decision(request.params.id);
    if (!item) return reply.code(404).send({ error: 'Decision not found' });
    reply.header('Content-Disposition', `attachment; filename="aetheris-decision-${item.id}.json"`);
    return item;
  });
  for (const route of ['/api/opensky', '/api/firms', '/api/ais', '/api/celestrak', '/api/weather']) {
    app.get(route, async (_request, reply) => reply.code(410).send({ status: 'unavailable', error: 'Use versioned, provenance-bearing /api/v1/feeds routes' }));
  }
  app.get('/ws/telemetry', { websocket: true }, socket => socket.send(JSON.stringify({ type: 'status', status: 'connected', note: 'No simulated anomaly stream' })));
  for (const [route, [name, type]] of Object.entries(STATIC)) app.get(route, async (_request, reply) => { reply.type(type); return readFile(path.join(PUBLIC, name)); });
  app.get('/world-regions.json', async (_request, reply) => { reply.type('application/json'); return readFile(WORLD_REGIONS); });
  return app;
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  const app = await buildServer();
  await app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
}
