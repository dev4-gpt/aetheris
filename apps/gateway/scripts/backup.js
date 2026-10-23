import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { createStore } from '../src/store.js';

const database = process.env.AETHERIS_DB_PATH;
if (!database || database === ':memory:') throw new Error('AETHERIS_DB_PATH must point to a persistent database');
const destinationDirectory = path.join(path.dirname(database), 'backups');
mkdirSync(destinationDirectory, { recursive: true, mode: 0o700 });
const destination = path.join(destinationDirectory, `aetheris-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
const store = createStore({ filename: database, adminPassword: process.env.AETHERIS_ADMIN_PASSWORD, invalidateSessions: false });
try { await store.writeBackup(destination); process.stdout.write(`${destination}\n`); }
finally { store.close(); }
