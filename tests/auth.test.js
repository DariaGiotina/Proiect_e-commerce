import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, PASSWORD } from './helpers.js';

const NEW_USER = {
  name: 'Carla',
  email: 'carla@test.local',
  password: 'carla-password-1',
  passwordConfirm: 'carla-password-1',
};

test('register logs the new client in and greets them', async () => {
  const { guest } = await createTestContext();
  const agent = guest();
  const res = await agent.post('/register').type('form').send(NEW_USER);
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/');
  const home = await agent.get('/');
  assert.match(home.text, /Hi, Carla/);
});

test('register with an existing email returns 409', async () => {
  const { guest } = await createTestContext();
  const res = await guest()
    .post('/register')
    .type('form')
    .send({ ...NEW_USER, email: 'ana@test.local' });
  assert.equal(res.status, 409);
  assert.match(res.text, /An account with this email already exists\./);
});

test('register with mismatched passwords returns 422 and keeps the typed name', async () => {
  const { guest, db } = await createTestContext();
  const res = await guest()
    .post('/register')
    .type('form')
    .send({ ...NEW_USER, passwordConfirm: 'something-else' });
  assert.equal(res.status, 422);
  assert.match(res.text, /Passwords do not match\./);
  assert.match(res.text, /value="Carla"/);
  const count = db.prepare("SELECT COUNT(*) FROM users WHERE email = 'carla@test.local'").pluck().get();
  assert.equal(count, 0);
});

test('login with a wrong password returns 401 and does not log in', async () => {
  const { guest } = await createTestContext();
  const agent = guest();
  const res = await agent
    .post('/login')
    .type('form')
    .send({ email: 'ana@test.local', password: 'wrong-password' });
  assert.equal(res.status, 401);
  assert.match(res.text, /Wrong email or password\./);
  const home = await agent.get('/');
  assert.doesNotMatch(home.text, /Hi, Ana/);
});

test('admin login goes to /admin and client login goes to /', async () => {
  const { guest } = await createTestContext();
  const admin = await guest()
    .post('/login')
    .type('form')
    .send({ email: 'admin@test.local', password: PASSWORD });
  assert.equal(admin.status, 302);
  assert.equal(admin.headers.location, '/admin');
  const client = await guest()
    .post('/login')
    .type('form')
    .send({ email: 'ANA@test.local', password: PASSWORD });
  assert.equal(client.status, 302);
  assert.equal(client.headers.location, '/');
});

test('login ignores an external next URL (no open redirect)', async () => {
  const { guest } = await createTestContext();
  const res = await guest()
    .post('/login')
    .type('form')
    .send({ email: 'ana@test.local', password: PASSWORD, next: '//evil.example' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/');
});

test('login follows a safe next URL', async () => {
  const { guest } = await createTestContext();
  const res = await guest()
    .post('/login')
    .type('form')
    .send({ email: 'ana@test.local', password: PASSWORD, next: '/products?q=pen' });
  assert.equal(res.headers.location, '/products?q=pen');
});

test('guest opening /admin is sent to login with next', async () => {
  const { guest } = await createTestContext();
  const res = await guest().get('/admin');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login?next=%2Fadmin');
});

test('client opening /admin gets 403', async () => {
  const { loginAs } = await createTestContext();
  const ana = await loginAs('ana@test.local');
  const res = await ana.get('/admin');
  assert.equal(res.status, 403);
  assert.match(res.text, /This area is for admins only/);
});

test('admin sees the dashboard and the Admin link', async () => {
  const { loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin.get('/admin');
  assert.equal(res.status, 200);
  assert.match(res.text, /href="\/admin"/);
});

test('logout ends the session', async () => {
  const { loginAs } = await createTestContext();
  const admin = await loginAs('admin@test.local');
  const res = await admin.post('/logout');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/');
  const after = await admin.get('/admin');
  assert.equal(after.status, 302);
  assert.match(after.headers.location, /^\/login/);
});

test('passwords are stored as bcrypt hashes', async () => {
  const { guest, db } = await createTestContext();
  await guest().post('/register').type('form').send(NEW_USER);
  const hash = db
    .prepare('SELECT password_hash FROM users WHERE email = ?')
    .pluck()
    .get(NEW_USER.email);
  assert.match(hash, /^\$2/);
  assert.notEqual(hash, NEW_USER.password);
});
