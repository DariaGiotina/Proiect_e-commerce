import { withConstraintMessages } from '../utils/errors.js';

const MESSAGES = {
  unique: 'A delivery method with this name already exists.',
  foreignKey: 'This delivery method is used by products and cannot be deleted.',
};

const COLUMNS = `
  d.id, d.name, d.price_cents AS priceCents, d.eta,
  (SELECT COUNT(*) FROM product_delivery_methods pdm WHERE pdm.delivery_method_id = d.id) AS productCount`;

export function listDeliveryMethods(db) {
  return db.prepare(`SELECT ${COLUMNS} FROM delivery_methods d ORDER BY d.price_cents, d.name`).all();
}

export function getDeliveryMethodById(db, id) {
  return db.prepare(`SELECT ${COLUMNS} FROM delivery_methods d WHERE d.id = ?`).get(id);
}

export function createDeliveryMethod(db, { name, priceCents, eta }) {
  return withConstraintMessages(
    () =>
      db.prepare('INSERT INTO delivery_methods (name, price_cents, eta) VALUES (?, ?, ?)').run(name, priceCents, eta)
        .lastInsertRowid,
    MESSAGES,
  );
}

export function updateDeliveryMethod(db, id, { name, priceCents, eta }) {
  withConstraintMessages(
    () =>
      db
        .prepare('UPDATE delivery_methods SET name = ?, price_cents = ?, eta = ? WHERE id = ?')
        .run(name, priceCents, eta, id),
    MESSAGES,
  );
}

export function deleteDeliveryMethod(db, id) {
  withConstraintMessages(() => db.prepare('DELETE FROM delivery_methods WHERE id = ?').run(id), MESSAGES);
}
