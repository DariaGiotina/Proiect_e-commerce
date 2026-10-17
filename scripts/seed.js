import fs from 'node:fs';
import path from 'node:path';
import { openDb } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';

const REQUIRED = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'DEMO_CLIENT_EMAIL', 'DEMO_CLIENT_PASSWORD'];
const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing from .env: ${missing.join(', ')} (see .env.example).`);
  process.exit(1);
}

const dbFile = process.env.DB_FILE || 'data/shop.db';
fs.mkdirSync(path.dirname(path.resolve(dbFile)), { recursive: true });

const db = openDb(dbFile);
migrate(db);
const { created } = seedDemoData(db, {
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  clientEmail: process.env.DEMO_CLIENT_EMAIL,
  clientPassword: process.env.DEMO_CLIENT_PASSWORD,
});
db.close();

console.log(
  created
    ? `Seeded ${dbFile} with the demo data 🎀`
    : `${dbFile} already has data, nothing was changed.`,
);
