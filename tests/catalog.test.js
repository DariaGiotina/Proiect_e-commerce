import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext } from './helpers.js';
import { listProducts } from '../src/models/productModel.js';

test('home page shows category bubbles and new arrivals', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /New arrivals/);
  assert.match(res.text, /Stationery/);
  assert.match(res.text, /Accessories/);
  assert.match(res.text, /Heart Pen/);
});

test('the catalog lists every product', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products');
  assert.equal(res.status, 200);
  for (const name of ['Fluffy Pink Planner', 'Bow Hair Clips', 'Heart Pen', 'Rosé Satin Headband']) {
    assert.ok(res.text.includes(name), `missing ${name}`);
  }
});

test('the catalog filters by category', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products?category=accessories');
  assert.equal(res.status, 200);
  assert.match(res.text, /Bow Hair Clips/);
  assert.match(res.text, /Rosé Satin Headband/);
  assert.doesNotMatch(res.text, /Heart Pen/);
});

test('search ignores accents', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products?q=rose');
  assert.match(res.text, /Rosé Satin Headband/);
  assert.doesNotMatch(res.text, /Heart Pen/);
});

test('search ignores capitals', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products?q=PLANNER');
  assert.match(res.text, /Fluffy Pink Planner/);
  assert.doesNotMatch(res.text, /Heart Pen/);
});

test('sorting by price puts the cheapest first', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products?sort=price_asc');
  assert.ok(res.text.indexOf('Heart Pen') < res.text.indexOf('Fluffy Pink Planner'));
  const desc = await guest().get('/products?sort=price_desc');
  assert.ok(desc.text.indexOf('Fluffy Pink Planner') < desc.text.indexOf('Heart Pen'));
});

test('an unknown category returns 404', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products?category=does-not-exist');
  assert.equal(res.status, 404);
});

test('the product page shows price, supplier, delivery and specs', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products/fluffy-pink-planner');
  assert.equal(res.status, 200);
  assert.match(res.text, /29\.99 RON/);
  assert.match(res.text, /Pink Atelier/);
  assert.match(res.text, /Express courier/);
  assert.match(res.text, /Pages/);
  assert.match(res.text, /160/);
});

test('an out-of-stock product has no add-to-cart button', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products/bow-hair-clips');
  assert.match(res.text, /Out of stock/);
  assert.doesNotMatch(res.text, /Add to cart/);
});

test('a low-stock product says how many are left', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products/rose-satin-headband');
  assert.match(res.text, /Only 3 left!/);
});

test('an unknown product slug returns 404', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products/nope');
  assert.equal(res.status, 404);
});

test('a literal % in the search does not match every product', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/products?q=%25');
  assert.equal(res.status, 200);
  assert.doesNotMatch(res.text, /Heart Pen/);
  assert.match(res.text, /No products found/);
});

test('listProducts paginates and falls back to newest for an unknown sort', async () => {
  const { db } = await createTestContext();
  const page1 = listProducts(db, { perPage: 3, sort: 'bogus' });
  assert.equal(page1.total, 4);
  assert.equal(page1.pages, 2);
  assert.equal(page1.items.length, 3);
  assert.equal(page1.items[0].name, 'Rosé Satin Headband');
  const page2 = listProducts(db, { perPage: 3, page: 2 });
  assert.equal(page2.items.length, 1);
  assert.equal(page2.items[0].category.slug, 'stationery');
});
