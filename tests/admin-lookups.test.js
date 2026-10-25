import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext } from './helpers.js';

test('admin creates a category with a slug from its name', async () => {
  const { db, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin
    .post('/admin/categories')
    .type('form')
    .send({ name: 'Jewelry', emoji: '💍', description: 'Sparkly things.' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/admin/categories');
  const list = await admin.get('/admin/categories');
  assert.match(list.text, /Category saved ✨/);
  assert.match(list.text, /Jewelry/);
  const row = db.prepare("SELECT slug, emoji FROM categories WHERE name = 'Jewelry'").get();
  assert.deepEqual(row, { slug: 'jewelry', emoji: '💍' });
});

test('admin edits a delivery method price typed with a dot', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const id = ids.deliveryMethods.standard;
  const form = await admin.get(`/admin/delivery-methods/${id}/edit`);
  assert.match(form.text, /value="15.99"/);
  const res = await admin
    .post(`/admin/delivery-methods/${id}`)
    .type('form')
    .send({ name: 'Standard courier', priceCents: '19.99', eta: '2–3 business days' });
  assert.equal(res.status, 302);
  const price = db.prepare('SELECT price_cents FROM delivery_methods WHERE id = ?').pluck().get(id);
  assert.equal(price, 1999);
});

test('an invalid price re-renders the form with 422', async () => {
  const { db, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin
    .post('/admin/delivery-methods')
    .type('form')
    .send({ name: 'Bike courier', priceCents: 'abc', eta: 'same day' });
  assert.equal(res.status, 422);
  assert.match(res.text, /Enter a valid price/);
  assert.match(res.text, /value="Bike courier"/);
  assert.equal(db.prepare("SELECT COUNT(*) FROM delivery_methods WHERE name = 'Bike courier'").pluck().get(), 0);
});

test('a missing required field re-renders the form with 422', async () => {
  const { loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin.post('/admin/suppliers').type('form').send({ name: '  ' });
  assert.equal(res.status, 422);
  assert.match(res.text, /Name is required\./);
});

test('a category that has products cannot be deleted', async () => {
  const { db, ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin.post(`/admin/categories/${ids.categories.stationery}/delete`);
  assert.equal(res.status, 409);
  assert.match(res.text, /cannot be deleted/);
  assert.ok(db.prepare('SELECT 1 FROM categories WHERE id = ?').get(ids.categories.stationery));
});

test('a delivery method used by products cannot be deleted', async () => {
  const { ids, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin.post(`/admin/delivery-methods/${ids.deliveryMethods.express}/delete`);
  assert.equal(res.status, 409);
  assert.match(res.text, /cannot be deleted/);
});

test('admin deletes a new empty supplier', async () => {
  const { db, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  await admin.post('/admin/suppliers').type('form').send({ name: 'Lonely Supplier' });
  const id = db.prepare("SELECT id FROM suppliers WHERE name = 'Lonely Supplier'").pluck().get();
  const res = await admin.post(`/admin/suppliers/${id}/delete`);
  assert.equal(res.status, 302);
  assert.equal(db.prepare('SELECT 1 FROM suppliers WHERE id = ?').get(id), undefined);
});

test('a duplicate category name returns 409', async () => {
  const { loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin
    .post('/admin/categories')
    .type('form')
    .send({ name: 'Stationery', emoji: '📒' });
  assert.equal(res.status, 409);
  assert.match(res.text, /already exists/);
});

test('editing an unknown id returns 404', async () => {
  const { loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin.get('/admin/categories/9999/edit');
  assert.equal(res.status, 404);
});

test('a client cannot create categories', async () => {
  const { db, loginAs } = await createTestContext();
  const ana = await loginAs('ana@test.local');
  const res = await ana.post('/admin/categories').type('form').send({ name: 'Hacked', emoji: '😈' });
  assert.equal(res.status, 403);
  assert.equal(db.prepare("SELECT COUNT(*) FROM categories WHERE name = 'Hacked'").pluck().get(), 0);
});
