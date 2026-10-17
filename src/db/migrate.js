import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_SQL = fs.readFileSync(path.join(import.meta.dirname, 'schema.sql'), 'utf8');

// Every statement in schema.sql uses IF NOT EXISTS, so this is safe to re-run.
export function migrate(db) {
  db.exec(SCHEMA_SQL);
}
