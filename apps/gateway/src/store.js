import { DatabaseSync, backup } from 'node:sqlite';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const hash = value => createHash('sha256').update(value).digest('hex');
const passwordHash = (password, salt) => scryptSync(password, salt, 64).toString('hex');

export function createStore({ filename = ':memory:', adminPassword, invalidateSessions = true } = {}) {
  if (typeof adminPassword !== 'string' || adminPassword.length < 14) throw new Error('AETHERIS_ADMIN_PASSWORD must be at least 14 characters');
  process.umask(0o077);
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  if (filename !== ':memory:') chmodSync(filename, 0o600);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS observations (id TEXT PRIMARY KEY, payload TEXT NOT NULL, saved_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS scenes (id TEXT PRIMARY KEY, payload TEXT NOT NULL, saved_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS decisions (id TEXT PRIMARY KEY, payload TEXT NOT NULL, saved_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, occurred_at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, prior_hash TEXT NOT NULL, entry_hash TEXT NOT NULL);`);
  if (invalidateSessions) db.exec('DELETE FROM sessions;');
  if (!db.prepare('SELECT id FROM users WHERE username=?').get('admin')) {
    const salt = randomBytes(16).toString('hex');
    db.prepare('INSERT INTO users(username,salt,password_hash,role) VALUES(?,?,?,?)').run('admin', salt, passwordHash(adminPassword, salt), 'admin');
  }

  function audit(actor, action, detail = '') {
    const prior = db.prepare('SELECT entry_hash FROM audit ORDER BY id DESC LIMIT 1').get()?.entry_hash || 'genesis';
    const occurredAt = new Date().toISOString();
    const entryHash = hash(JSON.stringify([prior, occurredAt, actor, action, detail]));
    db.prepare('INSERT INTO audit(occurred_at,actor,action,detail,prior_hash,entry_hash) VALUES(?,?,?,?,?,?)')
      .run(occurredAt, actor, action, detail, prior, entryHash);
  }
  function login(username, password) {
    const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
    const salt = user?.salt || '00000000000000000000000000000000';
    const candidate = Buffer.from(passwordHash(String(password), salt), 'hex');
    const expected = Buffer.from(user?.password_hash || '0'.repeat(128), 'hex');
    if (!user || !timingSafeEqual(candidate, expected)) return null;
    const token = randomBytes(32).toString('base64url');
    const csrf = randomBytes(24).toString('base64url');
    const expiresAt = Date.now() + 8 * 60 * 60_000;
    db.prepare('INSERT INTO sessions(token_hash,user_id,csrf,expires_at) VALUES(?,?,?,?)').run(hash(token), user.id, csrf, expiresAt);
    audit(user.username, 'login');
    return { token, csrf, expiresAt, username: user.username, role: user.role };
  }
  function session(token) {
    if (!token) return null;
    return db.prepare(`SELECT users.username,users.role,sessions.csrf,sessions.expires_at FROM sessions
      JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?`).get(hash(token), Date.now()) || null;
  }
  function logout(token) { if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token)); }
  function addUser(username, password, role) {
    if (!/^[a-zA-Z0-9._-]{3,48}$/.test(username) || !['admin', 'operator', 'viewer'].includes(role) || typeof password !== 'string' || password.length < 14) throw new TypeError('Invalid user');
    const salt = randomBytes(16).toString('hex');
    db.prepare('INSERT INTO users(username,salt,password_hash,role) VALUES(?,?,?,?)').run(username, salt, passwordHash(password, salt), role);
    audit('admin', 'user.create', username);
  }
  function saveObservation(item) {
    db.prepare('INSERT OR REPLACE INTO observations(id,payload,saved_at) VALUES(?,?,?)').run(item.id, JSON.stringify(item), new Date().toISOString());
  }
  function observations() { return db.prepare("SELECT payload FROM observations WHERE id LIKE 'import:%' ORDER BY saved_at DESC LIMIT 500").all().map(row => JSON.parse(row.payload)); }
  function observation(id) { const row = db.prepare('SELECT payload FROM observations WHERE id=?').get(id); return row && JSON.parse(row.payload); }
  function saveScene(item) { db.prepare('INSERT INTO scenes(id,payload,saved_at) VALUES(?,?,?)').run(item.id, JSON.stringify(item), new Date().toISOString()); }
  function scene(id) { const row = db.prepare('SELECT payload FROM scenes WHERE id=?').get(id); return row && JSON.parse(row.payload); }
  function saveDecision(item) {
    db.prepare('INSERT INTO decisions(id,payload,saved_at) VALUES(?,?,?)').run(item.id, JSON.stringify(item), new Date().toISOString());
  }
  function decision(id) { const row = db.prepare('SELECT payload FROM decisions WHERE id=?').get(id); return row && JSON.parse(row.payload); }
  function decisions() { return db.prepare('SELECT id,saved_at FROM decisions ORDER BY saved_at DESC LIMIT 100').all(); }
  async function writeBackup(destination) { await backup(db, destination); audit('system', 'backup', path.basename(destination)); }
  return { db, audit, login, session, logout, addUser, saveObservation, observations, observation, saveScene, scene, saveDecision, decision, decisions, writeBackup, close: () => db.close() };
}
