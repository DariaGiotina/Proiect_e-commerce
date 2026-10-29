import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext } from './helpers.js';
import { getProductById } from '../src/models/productModel.js';

// A valid 1×1 pixel PNG.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function productForm(agent, url, ids, overrides = {}) {
  const fields = {
    name: 'Cherry Hair Bow',
    description: 'A glossy cherry-red bow for special days.',
    specs: 'Material: satin\nWidth: 12 cm',
    price: '24.50',
    stock: '7',
    categoryId: String(ids.categories.accessories),
    supplierId: String(ids.suppliers.pinkAtelier),
    deliveryMethodIds: [String(ids.deliveryMethods.standard), String(ids.deliveryMethods.express)],
    ...overrides,
  };
  let req = agent.post(url);
  for (const [name, value] of Object.entries(fields)) {
    for (const v of [].concat(value)) req = req.field(name, v);
  }
  return req;
}

function productIdByName(db, name) {
  return db.prepare('SELECT id FROM products WHERE name = ?').pluck().get(name);
}

test('admin creates a product with every field and an image', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await productForm(admin, '/admin/products', ids).attach('image', TINY_PNG, 'bow.png');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/admin/products');

  const product = getProductById(db, productIdByName(db, 'Cherry Hair Bow'));
  assert.equal(product.priceCents, 2450);
  assert.equal(product.stock, 7);
  assert.equal(product.slug, 'cherry-hair-bow');
  assert.deepEqual(product.specs, [
    { key: 'Material', value: 'satin' },
    { key: 'Width', value: '12 cm' },
  ]);
  assert.equal(product.deliveryMethods.length, 2);
  assert.equal(product.category.slug, 'accessories');
  assert.equal(product.supplier.name, 'Pink Atelier');
  assert.match(product.imagePath, /^\/uploads\/.+\.png$/);

  const image = await admin.get(product.imagePath);
  assert.equal(image.status, 200);
});

test('a negative price re-renders the form with the typed values', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await productForm(admin, '/admin/products', ids, { price: '-5' });
  assert.equal(res.status, 422);
  assert.match(res.text, /Price must be greater than 0/);
  assert.match(res.text, /value="Cherry Hair Bow"/);
  assert.equal(productIdByName(db, 'Cherry Hair Bow'), undefined);
});

test('a fractional stock and a missing delivery method are rejected', async () => {
  const { ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const stock = await productForm(admin, '/admin/products', ids, { stock: '2.5' });
  assert.equal(stock.status, 422);
  assert.match(stock.text, /Stock must be a whole number/);
  const delivery = await productForm(admin, '/admin/products', ids, { deliveryMethodIds: [] });
  assert.equal(delivery.status, 422);
  assert.match(delivery.text, /Choose at least one delivery method\./);
});

test('a bad specs line is reported on the form', async () => {
  const { ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await productForm(admin, '/admin/products', ids, { specs: 'Material satin' });
  assert.equal(res.status, 422);
  assert.match(res.text, /Line 1 must look like Key: Value/);
});

test('an unknown category id is rejected', async () => {
  const { ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await productForm(admin, '/admin/products', ids, { categoryId: '9999' });
  assert.equal(res.status, 422);
  assert.match(res.text, /Choose a category\./);
});

test('uploading a text file as the image is rejected and nothing is saved', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await productForm(admin, '/admin/products', ids).attach(
    'image',
    Buffer.from('hello'),
    'notes.txt',
  );
  assert.equal(res.status, 422);
  assert.match(res.text, /The image must be a JPG, PNG or WEBP file, max 2 MB\./);
  assert.equal(productIdByName(db, 'Cherry Hair Bow'), undefined);
});

test('editing the price without a new image keeps the old image', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  await productForm(admin, '/admin/products', ids).attach('image', TINY_PNG, 'bow.png');
  const id = productIdByName(db, 'Cherry Hair Bow');
  const before = getProductById(db, id);

  const form = await admin.get(`/admin/products/${id}/edit`);
  assert.match(form.text, /value="24.50"/);
  assert.match(form.text, /Material: satin/);

  const res = await productForm(admin, `/admin/products/${id}`, ids, { price: '19,99' });
  assert.equal(res.status, 302);
  const after = getProductById(db, id);
  assert.equal(after.priceCents, 1999);
  assert.equal(after.imagePath, before.imagePath);
});

test('a duplicate name gets a numbered slug', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  await productForm(admin, '/admin/products', ids, { name: 'Fluffy Pink Planner' });
  const slugs = db
    .prepare("SELECT slug FROM products WHERE name = 'Fluffy Pink Planner' ORDER BY id")
    .pluck()
    .all();
  assert.deepEqual(slugs, ['fluffy-pink-planner', 'fluffy-pink-planner-2']);
});

test('deleting a product removes cart and wishlist rows but keeps order history', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const planner = ids.products.planner;
  db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 2)').run(ids.users.ana, planner);
  db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(ids.users.bianca, planner);
  const orderId = db
    .prepare(
      `INSERT INTO orders (user_id, full_name, email, phone, address, city, county, postal_code,
         delivery_method_name, delivery_price_cents, payment_method, subtotal_cents, total_cents)
       VALUES (?, 'Ana Parker', 'ana@test.local', '0712345678', '1 Rose St', 'Craiova', 'Dolj', '200000',
         'Standard courier', 1599, 'cash_on_delivery', 2999, 4598)`,
    )
    .run(ids.users.ana).lastInsertRowid;
  db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity)
     VALUES (?, ?, 'Fluffy Pink Planner', 2999, 1)`,
  ).run(orderId, planner);

  const admin = await loginAs('admin@test.local');
  const res = await admin.post(`/admin/products/${planner}/delete`);
  assert.equal(res.status, 302);

  assert.equal(db.prepare('SELECT COUNT(*) FROM cart_items WHERE product_id = ?').pluck().get(planner), 0);
  assert.equal(db.prepare('SELECT COUNT(*) FROM wishlist_items WHERE product_id = ?').pluck().get(planner), 0);
  const item = db.prepare('SELECT product_id, product_name FROM order_items WHERE order_id = ?').get(orderId);
  assert.deepEqual(item, { product_id: null, product_name: 'Fluffy Pink Planner' });
});

test('the admin product list shows prices and a low-stock warning', async () => {
  const { loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin.get('/admin/products');
  assert.equal(res.status, 200);
  assert.match(res.text, /Fluffy Pink Planner/);
  assert.match(res.text, /29\.99 RON/);
  assert.match(res.text, /⚠️ 3 left/);
});

test('a client cannot create products', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const ana = await loginAs('ana@test.local');
  const res = await productForm(ana, '/admin/products', ids);
  assert.equal(res.status, 403);
  assert.equal(productIdByName(db, 'Cherry Hair Bow'), undefined);
});
