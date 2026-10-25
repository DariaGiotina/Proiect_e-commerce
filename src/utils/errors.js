export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

// ON DELETE RESTRICT is enforced like a trigger, so SQLite reports it with this code.
const FOREIGN_KEY_CODES = new Set(['SQLITE_CONSTRAINT_FOREIGNKEY', 'SQLITE_CONSTRAINT_TRIGGER']);

// Runs a write and turns SQLite constraint errors into friendly 409s.
export function withConstraintMessages(write, { unique, foreignKey }) {
  try {
    return write();
  } catch (err) {
    if (unique && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new AppError(unique, 409);
    }
    if (foreignKey && FOREIGN_KEY_CODES.has(err.code)) {
      throw new AppError(foreignKey, 409);
    }
    throw err;
  }
}
