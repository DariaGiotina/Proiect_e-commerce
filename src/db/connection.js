import Database from 'better-sqlite3';

export function openDb(filename) {
  const db = new Database(filename);
  // SQLite turns foreign keys off by default, per connection.
  db.pragma('foreign_keys = ON');
  if (filename !== ':memory:' && filename !== '') {
    db.pragma('journal_mode = WAL');
  }
  return db;
}
