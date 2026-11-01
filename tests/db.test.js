import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { openDb } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { seedDemoData, attachDemoImages } from '../src/db/seed.js';
import { createTestContext } from './helpers.js';

const PUBLIC_DIR = path.resolve(import.meta.dirname, '../public');

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

test('every demo product gets a photo that exists in public/images', () => {
  const db = freshDb();
  seedDemoData(db, ACCOUNTS);
  const paths = db.prepare('SELECT image_path FROM products').pluck().all();
  assert.equal(paths.length, 20);
  for (const imagePath of paths) {
    assert.match(imagePath, /^\/images\/products\/[a-z0-9-]+\.jpg$/);
    assert.ok(fs.existsSync(path.join(PUBLIC_DIR, imagePath)), `missing file for ${imagePath}`);
  }
});

test('attachDemoImages fills in missing demo photos and keeps uploaded ones', () => {
  const db = freshDb();
  seedDemoData(db, ACCOUNTS);
  db.prepare("UPDATE products SET image_path = NULL WHERE slug = 'heart-pen'").run();
  db.prepare("UPDATE products SET image_path = '/uploads/mine.png' WHERE slug = 'xl-satin-bow'").run();

  assert.deepEqual(attachDemoImages(db), { updated: 1 });

  const imageOf = (slug) =>
    db.prepare('SELECT image_path FROM products WHERE slug = ?').pluck().get(slug);
  assert.equal(imageOf('heart-pen'), '/images/products/heart-pen.jpg');
  assert.equal(imageOf('xl-satin-bow'), '/uploads/mine.png');
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
