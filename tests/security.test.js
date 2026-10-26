import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, PASSWORD } from './helpers.js';

test('a login POST from another site is rejected (login CSRF)', async () => {
  const { guest } = await createTestContext();
  const res = await guest()
    .post('/login')
    .set('Origin', 'https://evil.example')
    .type('form')
    .send({ email: 'ana@test.local', password: PASSWORD });
  assert.equal(res.status, 403);
  assert.match(res.text, /sent from another website/);
});

test('an admin POST with a foreign Referer is rejected and changes nothing', async () => {
  const { db, loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin
    .post('/admin/categories')
    .set('Referer', 'https://evil.example/page')
    .type('form')
    .send({ name: 'Evil', emoji: '😈' });
  assert.equal(res.status, 403);
  assert.equal(db.prepare("SELECT COUNT(*) FROM categories WHERE name = 'Evil'").pluck().get(), 0);
});

test('a POST from the same origin is accepted', async () => {
  const { guest } = await createTestContext();
  const agent = guest();
  const res = await agent
    .post('/login')
    .set('Origin', 'http://shop.test')
    .set('Host', 'shop.test')
    .type('form')
    .send({ email: 'ana@test.local', password: PASSWORD });
  assert.equal(res.status, 302);
});
