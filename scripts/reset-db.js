import fs from 'node:fs';

const dbFile = process.env.DB_FILE || 'data/shop.db';

// WAL mode keeps two side files next to the database.
for (const file of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) {
  fs.rmSync(file, { force: true });
}
console.log(`Deleted ${dbFile}.`);

await import('./seed.js');
