import os from 'node:os';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { normalizeForSearch, slugify } from '../src/utils/text.js';

export const PASSWORD = 'test-password-123';

// Hashing is slow on purpose, so every test context reuses one hash.
let passwordHash;

const USERS = {
  admin: { name: 'Admin Test', email: 'admin@test.local', role: 'admin' },
  ana: { name: 'Ana Parker', email: 'ana@test.local', role: 'client' },
  bianca: { name: 'Bianca Moore', email: 'bianca@test.local', role: 'client' },
};

const CATEGORIES = {
  stationery: { name: 'Stationery', emoji: '📒' },
  accessories: { name: 'Accessories', emoji: '🎀' },
};

const DELIVERY_METHODS = {
  standard: { name: 'Standard courier', priceCents: 1599, eta: '2–3 business days' },
  express: { name: 'Express courier', priceCents: 2499, eta: '24 hours' },
};

const PRODUCTS = {
  planner: {
    name: 'Fluffy Pink Planner',
    description: 'A fluffy planner with dotted pages.',
    specs: [
      { key: 'Size', value: 'A5' },
      { key: 'Pages', value: '160' },
    ],
    priceCents: 2999, stock: 5, category: 'stationery', delivery: ['standard', 'express'],
  },
  clips: {
    name: 'Bow Hair Clips',
    description: 'A set of hair clips decorated with little bows.',
    specs: [{ key: 'Pieces', value: '6' }],
    priceCents: 1499, stock: 0, category: 'accessories', delivery: ['standard'],
  },
  pen: {
    name: 'Heart Pen',
    description: 'A gel pen with sparkly hearts.',
    specs: [{ key: 'Ink', value: 'gel, 0.5 mm' }],
    priceCents: 999, stock: 20, category: 'stationery', delivery: ['express'],
  },
  headband: {
    name: 'Rosé Satin Headband',
    description: 'A wide headband made of rosé pink satin.',
    specs: [{ key: 'Material', value: 'satin' }],
    priceCents: 1999, stock: 3, category: 'accessories', delivery: ['standard'],
  },
};

function insertFixtures(db) {
  const ids = { users: {}, categories: {}, suppliers: {}, deliveryMethods: {}, products: {} };
  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
  );
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, slug, emoji) VALUES (?, ?, ?)',
  );
  const insertDeliveryMethod = db.prepare(
    'INSERT INTO delivery_methods (name, price_cents, eta) VALUES (?, ?, ?)',
  );
  const insertProduct = db.prepare(
    `INSERT INTO products
       (name, slug, description, specs_json, price_cents, stock, category_id, supplier_id, search_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertProductDelivery = db.prepare(
    'INSERT INTO product_delivery_methods (product_id, delivery_method_id) VALUES (?, ?)',
  );

  db.transaction(() => {
    for (const [key, u] of Object.entries(USERS)) {
      ids.users[key] = insertUser.run(u.name, u.email, passwordHash, u.role).lastInsertRowid;
    }
    for (const [key, c] of Object.entries(CATEGORIES)) {
      ids.categories[key] = insertCategory.run(c.name, key, c.emoji).lastInsertRowid;
    }
    ids.suppliers.pinkAtelier = db
      .prepare("INSERT INTO suppliers (name) VALUES ('Pink Atelier')")
      .run().lastInsertRowid;
    for (const [key, m] of Object.entries(DELIVERY_METHODS)) {
      ids.deliveryMethods[key] = insertDeliveryMethod.run(m.name, m.priceCents, m.eta).lastInsertRowid;
    }
    for (const [key, p] of Object.entries(PRODUCTS)) {
      const productId = insertProduct.run(
        p.name,
        slugify(p.name),
        p.description,
        JSON.stringify(p.specs),
        p.priceCents,
        p.stock,
        ids.categories[p.category],
        ids.suppliers.pinkAtelier,
        normalizeForSearch(`${p.name} ${p.description}`),
      ).lastInsertRowid;
      ids.products[key] = productId;
      for (const method of p.delivery) {
        insertProductDelivery.run(productId, ids.deliveryMethods[method]);
      }
    }
  })();

  return ids;
}

export async function createTestContext() {
  passwordHash ??= await bcrypt.hash(PASSWORD, 10);

  const db = openDb(':memory:');
  migrate(db);
  const ids = insertFixtures(db);
  const app = createApp({ db, sessionSecret: 'test-secret', uploadsDir: os.tmpdir() });

  const guest = () => request.agent(app);
  const loginAs = async (email) => {
    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ email, password: PASSWORD });
    return agent;
  };

  return { db, app, guest, loginAs, ids };
}
