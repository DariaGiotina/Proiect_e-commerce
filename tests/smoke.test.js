import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db/connection.js';

test('home page renders with the shop name', async () => {
  const app = createApp({ db: openDb(':memory:'), sessionSecret: 't', uploadsDir: os.tmpdir() });
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /Blush &amp; Bow/);
});

test('unknown page renders the cute 404 page', async () => {
  const app = createApp({ db: openDb(':memory:'), sessionSecret: 't', uploadsDir: os.tmpdir() });
  const res = await request(app).get('/does-not-exist');
  assert.equal(res.status, 404);
  assert.match(res.text, /Page not found/);
});
