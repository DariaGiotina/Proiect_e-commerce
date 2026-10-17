import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { createTestContext } from './helpers.js';

const ACCOUNTS = {
  adminEmail: 'admin@test.local',
  adminPassword: 'admin-password-123',
  clientEmail: 'client@test.local',
  clientPassword: 'client-password-123',
};

function freshDb() {
  const db = openDb(':memory:');
  migrate(db);
  return db;
}

function counts(db) {
  const count = (sql) => db.prepare(sql).pluck().get();
  return {
    admins: count("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
    clients: count("SELECT COUNT(*) FROM users WHERE role = 'client'"),
    categories: count('SELECT COUNT(*) FROM categories'),
    products: count('SELECT COUNT(*) FROM products'),
    deliveryMethods: count('SELECT COUNT(*) FROM delivery_methods'),
  };
}

test('migrate twice does not throw', () => {
  const db = freshDb();
  assert.doesNotThrow(() => migrate(db));
});

test('seedDemoData creates 1 admin, 1 client, 5 categories, 20 products, 3 delivery methods', () => {
  const db = freshDb();
  const result = seedDemoData(db, ACCOUNTS);
  assert.deepEqual(result, { created: true });
  assert.deepEqual(counts(db), {
    admins: 1,
    clients: 1,
    categories: 5,
    products: 20,
    deliveryMethods: 3,
  });
});

test('seedDemoData is idempotent', () => {
  const db = freshDb();
  seedDemoData(db, ACCOUNTS);
  const before = counts(db);
  assert.deepEqual(seedDemoData(db, ACCOUNTS), { created: false });
  assert.deepEqual(counts(db), before);
});

test('foreign keys are enforced', () => {
  const db = freshDb();
  seedDemoData(db, ACCOUNTS);
  const supplierId = db.prepare('SELECT id FROM suppliers LIMIT 1').pluck().get();
  assert.throws(
    () =>
      db
        .prepare(
          `INSERT INTO products (name, slug, description, price_cents, stock, category_id, supplier_id, search_text)
           VALUES ('X', 'x', 'description', 100, 1, 999, ?, 'x')`,
        )
        .run(supplierId),
    { code: 'SQLITE_CONSTRAINT_FOREIGNKEY' },
  );
});

test('createTestContext inserts the shared fixtures', async () => {
  const { db, ids } = await createTestContext();
  const product = db
    .prepare('SELECT name, price_cents, stock, category_id FROM products WHERE id = ?')
    .get(ids.products.clips);
  assert.deepEqual(product, {
    name: 'Bow Hair Clips',
    price_cents: 1499,
    stock: 0,
    category_id: ids.categories.accessories,
  });
  const penDelivery = db
    .prepare('SELECT delivery_method_id FROM product_delivery_methods WHERE product_id = ?')
    .pluck()
    .all(ids.products.pen);
  assert.deepEqual(penDelivery, [ids.deliveryMethods.express]);
  const role = db.prepare('SELECT role FROM users WHERE id = ?').pluck().get(ids.users.admin);
  assert.equal(role, 'admin');
});
