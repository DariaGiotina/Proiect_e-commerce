import Database from 'better-sqlite3';

export function openDb(filename) {
  return new Database(filename);
}
