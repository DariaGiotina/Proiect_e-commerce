import bcrypt from 'bcryptjs';
import { AppError } from '../utils/errors.js';

const BCRYPT_COST = 10;
// Compared against when the email is unknown, so a wrong email takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

function toUser(row) {
  return row && { id: row.id, name: row.name, email: row.email, role: row.role };
}

export async function createUser(db, { name, email, password, role = 'client' }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  try {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email, passwordHash, role);
    return { id: lastInsertRowid, name, email, role };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new AppError('An account with this email already exists.', 409);
    }
    throw err;
  }
}

export function findUserById(db, id) {
  return toUser(db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id));
}

export async function authenticate(db, email, password) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const matches = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  return row && matches ? toUser(row) : null;
}
