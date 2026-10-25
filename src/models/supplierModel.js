import { withConstraintMessages } from '../utils/errors.js';

const MESSAGES = {
  unique: 'A supplier with this name already exists.',
  foreignKey: 'This supplier is used by products and cannot be deleted.',
};

export function listSuppliers(db) {
  return db
    .prepare(
      `SELECT s.id, s.name, s.email, s.phone, COUNT(p.id) AS productCount
       FROM suppliers s
       LEFT JOIN products p ON p.supplier_id = s.id
       GROUP BY s.id
       ORDER BY s.name`,
    )
    .all();
}

export function getSupplierById(db, id) {
  return db.prepare('SELECT id, name, email, phone FROM suppliers WHERE id = ?').get(id);
}

export function createSupplier(db, { name, email = '', phone = '' }) {
  return withConstraintMessages(
    () =>
      db.prepare('INSERT INTO suppliers (name, email, phone) VALUES (?, ?, ?)').run(name, email, phone)
        .lastInsertRowid,
    MESSAGES,
  );
}

export function updateSupplier(db, id, { name, email = '', phone = '' }) {
  withConstraintMessages(
    () =>
      db.prepare('UPDATE suppliers SET name = ?, email = ?, phone = ? WHERE id = ?').run(name, email, phone, id),
    MESSAGES,
  );
}

export function deleteSupplier(db, id) {
  withConstraintMessages(() => db.prepare('DELETE FROM suppliers WHERE id = ?').run(id), MESSAGES);
}
