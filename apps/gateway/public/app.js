import { projectGlobe, unprojectGlobe, solarPosition, sunlit } from './globeProjection.js';

const $ = id => document.getElementById(id);
function preference(key, allowed, fallback) { try { const value = localStorage.getItem(key); return allowed.includes(value) ? value : fallback; } catch { return fallback; } }
function savePreference(key, value) { try { localStorage.setItem(key, value); } catch {} }
const state = { csrf: null, role: null, layers: [], active: new Set(), feeds: new Map(), selected: new Map(), scene: null,
  land: [], globeTexture: null, markers: [], view: preference('aetheris.view', ['globe', 'flat'], 'globe'),
  theme: preference('aetheris.theme', ['dark', 'light'], 'dark'), globeLongitude: -35, globeLatitude: 25, globeZoom: 1, terrainYaw: Math.PI / 4 };

function applyTheme(theme) {
  state.theme = theme; document.documentElement.dataset.theme = theme;
  $('darkTheme').setAttribute('aria-pressed', String(theme === 'dark'));
  $('lightTheme').setAttribute('aria-pressed', String(theme === 'light'));
  savePreference('aetheris.theme', theme); buildGlobeTexture(); renderMap();
}
$('darkTheme').addEventListener('click', () => applyTheme('dark'));
$('lightTheme').addEventListener('click', () => applyTheme('light'));
document.documentElement.dataset.theme = state.theme;
$('darkTheme').setAttribute('aria-pressed', String(state.theme === 'dark'));
$('lightTheme').setAttribute('aria-pressed', String(state.theme === 'light'));
$('globeView').setAttribute('aria-pressed', String(state.view === 'globe'));
$('flatView').setAttribute('aria-pressed', String(state.view === 'flat'));
$('mapTitle').textContent = state.view === 'globe' ? 'Observation globe' : 'Observation map';

async function api(url, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.method && options.method !== 'GET' ? { 'X-CSRF-Token': state.csrf } : {}), ...options.headers };
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function status(id, message) { $(id).textContent = message; }
function safeLink(url) { try { const parsed = new URL(url); return parsed.protocol === 'https:' ? parsed.href : null; } catch { return null; } }
function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
const iso = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : 'Unknown';

async function enter(session) {
  state.csrf = session.csrf; state.role = session.role;
  $('loginPanel').hidden = true; $('workspace').hidden = false; $('logoutBtn').hidden = false;
  status('userLabel', `${session.username} · ${session.role}`);
  const [layers, imported, decisions] = await Promise.all([api('/api/v1/layers'), api('/api/v1/observations/imported'), api('/api/v1/decisions')]);
  state.layers = layers.layers;
  state.feeds.set('imported', { status: 'static', observations: imported.observations });
  renderLayers(); renderObservations(); renderDecisionList(decisions.decisions);
  try { const land = await fetch('/world-regions.json').then(r => r.json()); state.land = (land.features || []).filter(feature => feature.featurecla === 'Continent'); buildGlobeTexture(); renderMap(); } catch { status('mapStatus', 'Land outline unavailable; observation coordinates remain available'); }
}

function renderLayers() {
  const list = $('layerList'); list.replaceChildren();
  status('layerCount', `${state.layers.length} layers`);
  for (const layer of state.layers) {
    const result = state.feeds.get(layer.id);
    const button = el('button', undefined, `layer${state.active.has(layer.id) ? ' active' : ''}`);
    button.type = 'button'; button.setAttribute('aria-pressed', String(state.active.has(layer.id)));
    const row = el('span', undefined, 'layer-row');
    row.append(el('span', layer.title, 'layer-name'), el('span', result?.status || layer.mode, `state ${result?.status || layer.mode}`));
    button.append(row, el('span', `${layer.coverage}${result?.fetchedAt ? ` · fetched ${iso(result.fetchedAt)}` : ''}`, 'layer-meta'));
    button.addEventListener('click', () => toggleLayer(layer)); list.append(button);
  }
}

async function toggleLayer(layer) {
  if (state.active.has(layer.id)) { state.active.delete(layer.id); renderLayers(); renderObservations(); return; }
  state.active.add(layer.id); renderLayers();
  if (layer.mode === 'feed') {
    status('feedSummary', `Loading ${layer.title}…`);
    try { state.feeds.set(layer.id, await api(`/api/v1/feeds/${encodeURIComponent(layer.id)}`)); }
    catch (error) { state.feeds.set(layer.id, { status: 'unavailable', observations: [], error: error.message }); }
  } else {
    const computed = layer.mode === 'computed';
    state.feeds.set(layer.id, { status: computed ? 'computed' : 'unavailable', observations: [],
      error: computed ? null : layer.mode === 'permission-gated' ? 'Operational source permission is pending'
        : layer.mode === 'synthetic' ? 'Scenario engine is not enabled in this pilot' : 'Reviewed source or forecast adapter is pending' });
  }
  const result = state.feeds.get(layer.id);
  status('feedSummary', `${layer.title}: ${result.status}${result.error ? ` · ${result.error}` : ` · ${result.observations.length} records`}`);
  renderLayers(); renderObservations();
}

function activeObservations() {
  const items = [...state.active].flatMap(id => state.feeds.get(id)?.observations || []).concat(state.feeds.get('imported')?.observations || [], [...state.selected.values()]);
  return [...new Map(items.map(item => [item.id, item])).values()];
}

function renderObservations() {
  const records = activeObservations();
  status('observationCount', `${records.length}`);
  const list = $('observationList'); list.replaceChildren();
  for (const record of records.slice(0, 150)) {
    const button = el('button'); button.type = 'button';
    button.append(el('span', record.label), el('small', `${record.source.id} · ${record.status} · ${iso(record.observedAt)}`));
    button.addEventListener('click', () => selectObservation(record)); list.append(button);
  }
  status('mapStatus', `${records.filter(r => r.geometry).length} mapped points · ${records.length} records`);
  renderMap();
}

function selectObservation(record) {
  state.selected.set(record.id, record);
  if (record.geometry && state.view === 'globe') {
    state.globeLongitude = record.geometry.coordinates[0]; state.globeLatitude = Math.max(-75, Math.min(75, record.geometry.coordinates[1]));
  }
  const detail = $('evidenceDetail'); detail.replaceChildren();
  detail.append(el('span', record.status.toUpperCase(), `state ${record.status}`), el('h3', record.label));
  const dl = el('dl');
  const fields = [['Type', record.kind], ['Source', record.source.id], ['Observed', iso(record.observedAt)], ['Fetched', iso(record.fetchedAt)],
    ['Coordinates', record.geometry ? record.geometry.coordinates.join(', ') : 'No verified point'], ['Rights', record.source.license]];
  for (const [name, value] of fields) dl.append(el('dt', name), el('dd', String(value ?? 'Unknown')));
  detail.append(dl);
  const sourceUrl = safeLink(record.source.url); if (sourceUrl) { const a = el('a', 'Open source ↗'); a.href = sourceUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; detail.append(a); }
  const detailUrl = safeLink(record.properties?.detailUrl); if (detailUrl) { const a = el('a', ' · Open original ↗'); a.href = detailUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; detail.append(a); }
  detail.append(el('p', 'Included in next decision record. Review source rights and uncertainty before relying on it.', 'muted'));
  renderMap();
}

function canvasSize(canvas) { const ratio = Math.min(devicePixelRatio || 1, 2); const rect = canvas.getBoundingClientRect(); canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio); const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); return { ctx, width: rect.width, height: rect.height }; }

function buildGlobeTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 1440; canvas.height = 720;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = state.theme === 'light' ? '#bddde8' : '#153044'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const feature of state.land) for (const polygon of feature.polygons || []) {
    if (polygon.length < 3) continue;
    ctx.beginPath();
    polygon.forEach(([lon, lat], index) => { const x = (lon + 180) / 360 * canvas.width, y = (90 - lat) / 180 * canvas.height;
      if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.closePath(); ctx.fillStyle = state.theme === 'light' ? '#729d95' : '#45656b'; ctx.fill();
    ctx.strokeStyle = state.theme === 'light' ? '#3c746f' : '#83aaa9'; ctx.lineWidth = .7; ctx.stroke();
  }
  state.globeTexture = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function renderMap() { if (state.view === 'globe') renderGlobe(); else renderFlatMap(); }

function renderGlobe() {
  const canvas = $('worldMap'); if (!canvas || canvas.getBoundingClientRect().width === 0) return;
  const { ctx, width, height } = canvasSize(canvas), pixelWidth = canvas.width, pixelHeight = canvas.height;
  const ratio = pixelWidth / width, cx = width / 2, cy = height / 2, radius = Math.min(width, height) * .43 * state.globeZoom;
  const pixelCx = cx * ratio, pixelCy = cy * ratio, pixelRadius = radius * ratio;
  const texture = state.globeTexture;
  const image = ctx.createImageData(pixelWidth, pixelHeight), pixels = image.data;
  const sun = state.active.has('day-night') ? solarPosition(new Date()) : null;
  if (texture) {
    const centerLat = state.globeLatitude * Math.PI / 180, sinCenter = Math.sin(centerLat), cosCenter = Math.cos(centerLat);
    const startY = Math.max(0, Math.floor(pixelCy - pixelRadius)), endY = Math.min(pixelHeight, Math.ceil(pixelCy + pixelRadius));
    for (let py = startY; py < endY; py++) {
      const y = (pixelCy - py) / pixelRadius, halfWidth = Math.sqrt(Math.max(0, 1 - y * y)) * pixelRadius;
      for (let px = Math.max(0, Math.floor(pixelCx - halfWidth)); px < Math.min(pixelWidth, Math.ceil(pixelCx + halfWidth)); px++) {
        const x = (px - pixelCx) / pixelRadius, distance = x * x + y * y;
        if (distance > 1) continue;
        const depth = Math.sqrt(1 - distance);
        const lat = Math.asin(depth * sinCenter + y * cosCenter);
        const lon = state.globeLongitude * Math.PI / 180 + Math.atan2(x, depth * cosCenter - y * sinCenter);
        const longitude = lon * 180 / Math.PI, latitude = lat * 180 / Math.PI;
        const u = ((Math.floor((lon / (2 * Math.PI) + .5) * texture.width) % texture.width) + texture.width) % texture.width;
        const v = Math.max(0, Math.min(texture.height - 1, Math.floor((.5 - lat / Math.PI) * texture.height)));
        const source = (v * texture.width + u) * 4, target = (py * pixelWidth + px) * 4;
        let light = state.theme === 'light' ? .72 + .28 * Math.pow(depth, .55) : .45 + .55 * Math.pow(depth, .55);
        if (sun && sunlit(longitude, latitude, sun) < 0) light *= .38;
        pixels[target] = texture.data[source] * light;
        pixels[target + 1] = texture.data[source + 1] * light;
        pixels[target + 2] = texture.data[source + 2] * light;
        pixels[target + 3] = 255;
      }
    }
  }
  ctx.putImageData(image, 0, 0);
  ctx.strokeStyle = state.theme === 'light' ? '#709ca9' : '#5a8999'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  const graticule = (coordinates) => { ctx.beginPath(); let drawing = false;
    for (const coordinate of coordinates) { const point = projectGlobe(coordinate, state.globeLongitude, state.globeLatitude);
      if (point.depth < 0) { drawing = false; continue; }
      const x = cx + point.x * radius, y = cy - point.y * radius;
      if (drawing) ctx.lineTo(x, y); else ctx.moveTo(x, y); drawing = true;
    } ctx.stroke(); };
  ctx.strokeStyle = state.theme === 'light' ? '#18495948' : '#add8d624'; ctx.lineWidth = .65;
  for (let lon = -180; lon < 180; lon += 30) graticule(Array.from({ length: 73 }, (_, index) => [lon, -90 + index * 2.5]));
  for (let lat = -60; lat <= 60; lat += 30) graticule(Array.from({ length: 145 }, (_, index) => [-180 + index * 2.5, lat]));
  state.markers = [];
  for (const record of activeObservations()) {
    if (!record.geometry) continue;
    const point = projectGlobe(record.geometry.coordinates, state.globeLongitude, state.globeLatitude);
    if (point.depth < 0) continue;
    const x = cx + point.x * radius, y = cy - point.y * radius;
    ctx.beginPath(); ctx.arc(x, y, state.selected.has(record.id) ? 5.5 : 3.2, 0, Math.PI * 2);
    ctx.fillStyle = record.status === 'live' ? '#86e5d2' : record.status === 'synthetic' ? '#9c8cee' : '#eebd72'; ctx.fill();
    state.markers.push({ x, y, record });
  }
  $('mapHint').textContent = `${state.markers.length} points on visible hemisphere · drag to rotate · scroll to zoom`;
}

function renderFlatMap() {
  const canvas = $('worldMap'); if (!canvas || canvas.getBoundingClientRect().width === 0) return;
  const { ctx, width, height } = canvasSize(canvas);
  const project = ([lon, lat]) => [(lon + 180) / 360 * width, (90 - lat) / 180 * height];
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = state.theme === 'light' ? '#b2cad3' : '#29465a'; ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) { const x = project([lon, 0])[0]; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { const y = project([0, lat])[1]; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  ctx.fillStyle = state.theme === 'light' ? '#8eb5ac' : '#244a52'; ctx.strokeStyle = state.theme === 'light' ? '#4b837d' : '#5d8a88'; ctx.lineWidth = .6;
  for (const feature of state.land) for (const polygon of feature.polygons || []) {
    if (!polygon.length) continue; ctx.beginPath(); polygon.forEach((p, i) => { const [x, y] = project(p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if (state.active.has('day-night')) {
    const time = new Date(), day = Math.floor((time - Date.UTC(time.getUTCFullYear(), 0, 0)) / 86_400_000);
    const declination = 23.44 * Math.sin(2 * Math.PI * (day - 81) / 365) * Math.PI / 180;
    const subsolarLongitude = (12 - (time.getUTCHours() + time.getUTCMinutes() / 60)) * 15;
    ctx.fillStyle = '#050b1599';
    for (let lat = -90; lat < 90; lat += 6) for (let lon = -180; lon < 180; lon += 6) {
      const phi = (lat + 3) * Math.PI / 180, hourAngle = (lon + 3 - subsolarLongitude) * Math.PI / 180;
      const solar = Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle);
      if (solar < 0) { const [x, y] = project([lon, lat + 6]); ctx.fillRect(x, y, width / 60 + 1, height / 30 + 1); }
    }
  }
  state.markers = [];
  for (const record of activeObservations()) {
    if (!record.geometry) continue; const [x, y] = project(record.geometry.coordinates);
    ctx.beginPath(); ctx.arc(x, y, state.selected.has(record.id) ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = record.status === 'live' ? '#86e5d2' : record.status === 'synthetic' ? '#9c8cee' : '#eebd72'; ctx.fill();
    state.markers.push({ x, y, record });
  }
  $('mapHint').textContent = 'Flat map · choose a marker to inspect provenance';
}

function renderTerrain() {
  const canvas = $('terrainCanvas'); const { ctx, width, height } = canvasSize(canvas);
  ctx.fillStyle = '#0b1b2a'; ctx.fillRect(0, 0, width, height);
  if (!state.scene) { ctx.fillStyle = '#819eae'; ctx.font = '13px system-ui'; ctx.fillText('No grounded area loaded', 20, height / 2); return; }
  const points = state.scene.terrain.points, min = state.scene.review.minHeightMeters, max = state.scene.review.maxHeightMeters;
  const scale = Math.max(1, max - min); const side = Math.min(width / 7, height / 4.5);
  const p = (row, col, elevation = points[Math.round(row) * 5 + Math.round(col)]?.heightMeters ?? min) => {
    const dx = col - 2, dy = row - 2, yaw = state.terrainYaw;
    const horizontal = dx * Math.cos(yaw) - dy * Math.sin(yaw);
    const depth = dx * Math.sin(yaw) + dy * Math.cos(yaw);
    return [width / 2 + horizontal * side * .85, height * .62 + depth * side * .38 - (elevation - min) / scale * side * 1.4];
  };
  ctx.strokeStyle = '#73d5c3'; ctx.lineWidth = 1.4;
  for (let row = 0; row < 5; row++) { ctx.beginPath(); for (let col = 0; col < 5; col++) { const [x, y] = p(row, col); col ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  for (let col = 0; col < 5; col++) { ctx.beginPath(); for (let row = 0; row < 5; row++) { const [x, y] = p(row, col); row ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  for (const asset of state.scene.generatedAssets) { const row = Math.floor(asset.gridIndex / 5), col = asset.gridIndex % 5; const [x, y] = p(row, col);
    ctx.fillStyle = '#bd9ae5'; ctx.fillRect(x - 4, y - 9, 8, 8); }
  const area = state.scene.area, latSpan = area.radiusKm / 111.2, lonSpan = area.radiusKm / (111.2 * Math.cos(area.latitude * Math.PI / 180));
  for (const record of state.selected.values()) { if (!record.geometry) continue; const [lon, lat] = record.geometry.coordinates;
    const col = 2 + (lon - area.longitude) / lonSpan * 2, row = 2 + (lat - area.latitude) / latSpan * 2;
    if (row < 0 || row > 4 || col < 0 || col > 4) continue;
    const nearest = points[Math.round(row) * 5 + Math.round(col)].heightMeters; const [x, y] = p(row, col, nearest);
    ctx.beginPath(); ctx.arc(x, y - 8, 5, 0, Math.PI * 2); ctx.fillStyle = '#77aaff'; ctx.fill(); }
  ctx.fillStyle = '#a2c7d2'; ctx.font = '12px system-ui'; ctx.fillText(`USGS 3DEP · ${min.toFixed(1)}–${max.toFixed(1)} m · 25 samples`, 18, 26);
  ctx.fillText('Drag to rotate · violet = synthetic · blue = selected observation', 18, height - 16);
}

async function reloadDecisions() { const response = await api('/api/v1/decisions'); renderDecisionList(response.decisions); }
function renderDecisionList(items) {
  const list = $('decisionList'); list.replaceChildren();
  for (const item of items) { const button = el('button', `${iso(item.saved_at)} · ${item.id.slice(0, 8)} · replay / export`); button.type = 'button';
    button.addEventListener('click', async () => { try { const record = await api(`/api/v1/decisions/${item.id}`); state.scene = record.scene; state.selected = new Map(record.observations.map(o => [o.id, o])); renderTerrain(); renderObservations();
      status('decisionStatus', `Replaying: ${record.title}. `); const a = el('a', 'Download JSON'); a.href = `/api/v1/decisions/${item.id}/export`; $('decisionStatus').append(a);
      if (record.observations[0]) selectObservation(record.observations[0]); } catch (error) { status('decisionStatus', error.message); } }); list.append(button); }
}

$('loginForm').addEventListener('submit', async event => { event.preventDefault(); const form = new FormData(event.currentTarget);
  try { await enter(await api('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) })); status('loginError', ''); }
  catch (error) { status('loginError', error.message); } });
$('logoutBtn').addEventListener('click', async () => { try { await api('/api/v1/auth/logout', { method: 'POST', body: '{}' }); } finally { location.reload(); } });
$('areaForm').addEventListener('submit', async event => { event.preventDefault(); const form = new FormData(event.currentTarget);
  status('terrainStatus', 'Requesting 25 USGS elevation points…');
  try { state.scene = await api('/api/v1/scenes', { method: 'POST', body: JSON.stringify({ ...Object.fromEntries(form), includeIllustrativeAssets: form.has('includeIllustrativeAssets') }) }); renderTerrain();
    status('terrainStatus', `Grounded area ready · ${state.scene.review.minHeightMeters.toFixed(1)}–${state.scene.review.maxHeightMeters.toFixed(1)} m · interpolated, not surveyed.`); }
  catch (error) { status('terrainStatus', `Area unavailable: ${error.message}`); } });
$('importFile').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return;
  if (file.size > 1_000_000) { status('decisionStatus', 'Import exceeds 1 MB'); return; }
  try { const result = await api('/api/v1/observations/import', { method: 'POST', body: await file.text() }); state.feeds.set('imported', { status: 'static', observations: result.observations });
    renderObservations(); status('decisionStatus', `${result.observations.length} imported; source metadata is user declared.`); }
  catch (error) { status('decisionStatus', `Import failed: ${error.message}`); } });
$('decisionForm').addEventListener('submit', async event => { event.preventDefault(); if (!state.scene) { status('decisionStatus', 'Build a grounded area first.'); return; }
  const form = new FormData(event.currentTarget);
  try { const result = await api('/api/v1/decisions', { method: 'POST', body: JSON.stringify({ title: form.get('title'), note: form.get('note'), sceneId: state.scene.id, observationIds: [...state.selected.keys()].slice(0, 50) }) });
    status('decisionStatus', `Saved ${result.id}. `); const link = el('a', 'Download JSON'); link.href = `/api/v1/decisions/${result.id}/export`; $('decisionStatus').append(link); await reloadDecisions(); }
  catch (error) { status('decisionStatus', error.message); } });
function setWorldView(view) {
  state.view = view;
  savePreference('aetheris.view', view);
  $('globeView').setAttribute('aria-pressed', String(view === 'globe'));
  $('flatView').setAttribute('aria-pressed', String(view === 'flat'));
  $('mapTitle').textContent = view === 'globe' ? 'Observation globe' : 'Observation map';
  $('worldMap').setAttribute('aria-label', view === 'globe' ? 'Rotatable globe showing selected observations' : 'Global map showing selected observations');
  renderMap();
}
$('globeView').addEventListener('click', () => setWorldView('globe'));
$('flatView').addEventListener('click', () => setWorldView('flat'));
$('resetView').addEventListener('click', () => { state.globeLongitude = -35; state.globeLatitude = 25; state.globeZoom = 1; setWorldView('globe'); });
let mapDrag = null, mapMoved = false, mapFrame = null;
function queueMapRender() { if (mapFrame !== null) return; mapFrame = requestAnimationFrame(() => { mapFrame = null; renderMap(); }); }
$('worldMap').addEventListener('pointerdown', event => { if (state.view !== 'globe') return;
  mapDrag = { x: event.clientX, y: event.clientY }; mapMoved = false; event.currentTarget.setPointerCapture(event.pointerId); });
$('worldMap').addEventListener('pointermove', event => { if (!mapDrag || state.view !== 'globe') return;
  const dx = event.clientX - mapDrag.x, dy = event.clientY - mapDrag.y;
  if (Math.abs(dx) + Math.abs(dy) > 1) mapMoved = true;
  state.globeLongitude = ((state.globeLongitude - dx * .45 + 180) % 360 + 360) % 360 - 180;
  state.globeLatitude = Math.max(-85, Math.min(85, state.globeLatitude + dy * .45));
  mapDrag = { x: event.clientX, y: event.clientY }; queueMapRender(); });
$('worldMap').addEventListener('pointerup', () => { mapDrag = null; });
$('worldMap').addEventListener('pointercancel', () => { mapDrag = null; });
$('worldMap').addEventListener('wheel', event => { if (state.view !== 'globe') return;
  event.preventDefault(); state.globeZoom = Math.max(.68, Math.min(1.15, state.globeZoom - Math.sign(event.deltaY) * .08)); queueMapRender(); }, { passive: false });
$('worldMap').addEventListener('click', event => { if (mapMoved) { mapMoved = false; return; }
  const rect = event.currentTarget.getBoundingClientRect(); const x = event.clientX - rect.left, y = event.clientY - rect.top;
  const nearest = state.markers.reduce((best, item) => { const d = Math.hypot(item.x - x, item.y - y); return d < best.distance ? { item, distance: d } : best; }, { item: null, distance: 12 });
  if (nearest.item) selectObservation(nearest.item.record);
  else if (state.view === 'globe') { const radius = Math.min(rect.width, rect.height) * .43 * state.globeZoom;
    const location = unprojectGlobe((x - rect.width / 2) / radius, (rect.height / 2 - y) / radius, state.globeLongitude, state.globeLatitude);
    if (location) { state.globeLongitude = location[0]; state.globeLatitude = Math.max(-85, Math.min(85, location[1])); renderMap(); }
  } });
window.addEventListener('resize', () => { renderMap(); renderTerrain(); });
let terrainDrag = null;
$('terrainCanvas').addEventListener('pointerdown', event => { terrainDrag = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); });
$('terrainCanvas').addEventListener('pointermove', event => { if (terrainDrag === null) return; state.terrainYaw += (event.clientX - terrainDrag) * .012; terrainDrag = event.clientX; renderTerrain(); });
$('terrainCanvas').addEventListener('pointerup', () => { terrainDrag = null; });
api('/api/v1/auth/session').then(enter).catch(() => {});
