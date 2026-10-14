import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './src/app.js';
import { openDb } from './src/db/connection.js';

const port = Number(process.env.PORT) || 3000;
const dbFile = process.env.DB_FILE || 'data/shop.db';
const uploadsDir = path.resolve(import.meta.dirname, 'public/uploads');

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is missing from .env (see .env.example).');
  process.exit(1);
}

fs.mkdirSync(path.dirname(path.resolve(dbFile)), { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const db = openDb(dbFile);
const app = createApp({ db, sessionSecret: process.env.SESSION_SECRET, uploadsDir });

app.listen(port, () => {
  console.log(`Blush & Bow 🎀 running at http://localhost:${port}`);
});
