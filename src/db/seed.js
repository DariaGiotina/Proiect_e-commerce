import bcrypt from 'bcryptjs';
import { slugify, normalizeForSearch } from '../utils/text.js';

const SUPPLIERS = [
  { name: 'Pink Atelier Ltd', email: 'contact@pinkatelier.example', phone: '0721 000 111' },
  { name: 'Petal Crafts', email: 'hello@petalcrafts.example', phone: '0732 000 222' },
  { name: 'Sweet Design', email: 'hi@sweetdesign.example', phone: '0743 000 333' },
];

const DELIVERY_METHODS = {
  standard: { name: 'Standard courier', priceCents: 1599, eta: '2–3 business days' },
  express: { name: 'Express courier', priceCents: 2499, eta: '24 hours' },
  locker: { name: 'Locker pickup', priceCents: 999, eta: '1–2 days' },
};

const CATEGORIES = [
  {
    name: 'Stationery',
    emoji: '📒',
    description: 'Planners, pens and notes that make every to-do list cuter.',
    products: [
      {
        name: 'Fluffy Pink Planner',
        description: 'A planner with a fluffy pink cover, dotted pages and a satin bookmark.',
        specs: { Size: 'A5', Pages: '160, dotted', Cover: 'pink plush' },
        priceCents: 4999, stock: 12, supplier: 0, delivery: ['standard', 'express', 'locker'],
      },
      {
        name: 'Heart Pen',
        description: 'A black gel pen with a cap decorated with sparkly little hearts.',
        specs: { Color: 'pale pink', Ink: 'gel, 0.5 mm' },
        priceCents: 999, stock: 30, supplier: 2, delivery: ['standard', 'locker'],
      },
      {
        name: 'Bow Sticky Notes Set',
        description: 'Four bow-shaped sticky note pads in soft pastel shades.',
        specs: { Pieces: '4 × 50 sheets', Colors: 'pink, lavender, peach, mint', Size: '7 × 7 cm' },
        priceCents: 1899, stock: 25, supplier: 1, delivery: ['standard', 'locker'],
      },
      {
        name: 'Petal Weekly Planner',
        description: 'An undated weekly planner with petal stickers and an elastic closure.',
        specs: { Size: 'A5', Pages: '120', Binding: 'gold spiral', Extra: 'sticker sheet' },
        priceCents: 5999, stock: 8, supplier: 0, delivery: ['standard', 'express'],
      },
    ],
  },
  {
    name: 'Hair Accessories',
    emoji: '🎀',
    description: 'Bows, clips and headbands for fairytale hairstyles.',
    products: [
      {
        name: 'XL Satin Bow',
        description: 'A big powder-pink satin bow on a sturdy metal clip.',
        specs: { Material: 'satin', Width: '18 cm', Fastening: 'metal clip' },
        priceCents: 2499, stock: 20, supplier: 1, delivery: ['standard', 'express', 'locker'],
      },
      {
        name: 'Pearl Hair Clips',
        description: 'A set of gold hair clips decorated with tiny pearls, perfect for special days.',
        specs: { Pieces: '6', Material: 'gold-tone metal, faux pearls' },
        priceCents: 1999, stock: 0, supplier: 2, delivery: ['standard'],
      },
      {
        name: 'Pink Velvet Headband',
        description: 'A wide velvet headband with a decorative knot on top.',
        specs: { Material: 'velvet', Color: 'raspberry pink', Width: '4 cm' },
        priceCents: 3499, stock: 2, supplier: 1, delivery: ['standard', 'express'],
      },
      {
        name: 'Pastel Scrunchies',
        description: 'Three faux-silk scrunchies that are gentle on your hair.',
        specs: { Pieces: '3', Material: 'faux silk', Colors: 'pink, lilac, cream' },
        priceCents: 2299, stock: 18, supplier: 0, delivery: ['standard', 'locker'],
      },
    ],
  },
  {
    name: 'Beauty',
    emoji: '💄',
    description: 'Little treats for lips, hands and cheeks.',
    products: [
      {
        name: 'Strawberry Lip Balm',
        description: 'A moisturizing lip balm with shea butter and a ripe strawberry scent.',
        specs: { Size: '4.5 g', Scent: 'strawberry', Ingredients: 'shea butter, vitamin E' },
        priceCents: 1599, stock: 28, supplier: 2, delivery: ['standard', 'express', 'locker'],
      },
      {
        name: 'Peony Hand Cream',
        description: 'A light, fast-absorbing hand cream with a peony scent.',
        specs: { Size: '50 ml', Scent: 'peony' },
        priceCents: 2799, stock: 15, supplier: 1, delivery: ['standard', 'locker'],
      },
      {
        name: 'Blush & Bow Cheek Blush',
        description: 'A pressed blush with a satin finish in a bow-shaped compact.',
        specs: { Shade: 'peach pink', Finish: 'satin', Weight: '6 g' },
        priceCents: 4499, stock: 10, supplier: 0, delivery: ['standard', 'express'],
      },
      {
        name: 'Heart Compact Mirror',
        description: 'A heart-shaped pocket mirror with one regular side and one magnifying side.',
        specs: { Diameter: '7 cm', Magnification: '1× and 2×', Material: 'enamelled metal' },
        priceCents: 3299, stock: 6, supplier: 2, delivery: ['standard', 'locker'],
      },
    ],
  },
  {
    name: 'Decor',
    emoji: '🕯️',
    description: 'Pink details that turn any room into a storybook corner.',
    products: [
      {
        name: 'Crème Brûlée Candle',
        description: 'A soy wax candle in a pink glass jar with a cotton wick and a sweet vanilla scent.',
        specs: { Wax: 'soy', 'Burn time': 'about 35 hours', Scent: 'vanilla and caramel' },
        priceCents: 5499, stock: 14, supplier: 1, delivery: ['standard', 'express'],
      },
      {
        name: 'Bow Fairy Lights',
        description: 'A string of 20 warm LED lights decorated with pink tulle bows.',
        specs: { Length: '3 m', LEDs: '20, warm white', Power: '2 × AA batteries' },
        priceCents: 6999, stock: 9, supplier: 0, delivery: ['standard'],
      },
      {
        name: 'Wavy Ceramic Vase',
        description: 'A glazed ceramic vase with wavy edges and a glossy finish.',
        specs: { Height: '18 cm', Material: 'ceramic', Color: 'bubblegum pink' },
        priceCents: 8999, stock: 5, supplier: 2, delivery: ['standard', 'express'],
      },
      {
        name: 'Little Hearts Photo Frame',
        description: 'A painted wooden photo frame decorated with raised little hearts.',
        specs: { 'Photo size': '10 × 15 cm', Material: 'wood' },
        priceCents: 3999, stock: 11, supplier: 1, delivery: ['standard', 'locker'],
      },
    ],
  },
  {
    name: 'Plushies',
    emoji: '🧸',
    description: 'Fluffy friends for hugs and cute shelves.',
    products: [
      {
        name: 'Peony Teddy Bear',
        description: 'An extra-soft teddy bear with a satin bow around its neck.',
        specs: { Height: '30 cm', Material: 'polyester plush', Age: '3+ years' },
        priceCents: 7999, stock: 7, supplier: 0, delivery: ['standard', 'express'],
      },
      {
        name: 'Marshmallow Bunny',
        description: 'A white and pink bunny with long ears and embroidered rosy cheeks.',
        specs: { Height: '25 cm', Material: 'minky plush', Age: '0+ years' },
        priceCents: 6499, stock: 13, supplier: 2, delivery: ['standard', 'locker'],
      },
      {
        name: 'Pink Cloud Pillow',
        description: 'A cloud-shaped decorative pillow filled with soft siliconized fiber.',
        specs: { Size: '45 × 30 cm', Cover: 'removable', Washing: '30 °C' },
        priceCents: 5999, stock: 4, supplier: 1, delivery: ['standard'],
      },
      {
        name: 'Kitty Keychain',
        description: 'A plush keychain with a fluffy kitten and a gold-tone metal ring.',
        specs: { Height: '10 cm', Fastening: 'metal ring' },
        priceCents: 1799, stock: 22, supplier: 2, delivery: ['standard', 'express', 'locker'],
      },
    ],
  },
];

const BCRYPT_COST = 10;

// Demo photos live in public/images/products/<slug>.jpg (credits: public/images/CREDITS.md).
const demoImagePath = (slug) => `/images/products/${slug}.jpg`;

// Does nothing if the shop already has categories, so it is safe to re-run.
export function seedDemoData(db, { adminEmail, adminPassword, clientEmail, clientPassword }) {
  const hasData = db.prepare('SELECT 1 FROM categories LIMIT 1').get();
  if (hasData) {
    return { created: false };
  }

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
  );
  const insertSupplier = db.prepare('INSERT INTO suppliers (name, email, phone) VALUES (?, ?, ?)');
  const insertDeliveryMethod = db.prepare(
    'INSERT INTO delivery_methods (name, price_cents, eta) VALUES (?, ?, ?)',
  );
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, slug, emoji, description) VALUES (?, ?, ?, ?)',
  );
  const insertProduct = db.prepare(
    `INSERT INTO products
       (name, slug, description, specs_json, price_cents, stock, category_id, supplier_id, image_path, search_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertProductDelivery = db.prepare(
    'INSERT INTO product_delivery_methods (product_id, delivery_method_id) VALUES (?, ?)',
  );

  const adminHash = bcrypt.hashSync(adminPassword, BCRYPT_COST);
  const clientHash = bcrypt.hashSync(clientPassword, BCRYPT_COST);

  db.transaction(() => {
    insertUser.run('Administrator', adminEmail, adminHash, 'admin');
    insertUser.run('Demo Client', clientEmail, clientHash, 'client');

    const supplierIds = SUPPLIERS.map(
      (s) => insertSupplier.run(s.name, s.email, s.phone).lastInsertRowid,
    );
    const deliveryIds = Object.fromEntries(
      Object.entries(DELIVERY_METHODS).map(([key, m]) => [
        key,
        insertDeliveryMethod.run(m.name, m.priceCents, m.eta).lastInsertRowid,
      ]),
    );

    for (const category of CATEGORIES) {
      const categoryId = insertCategory.run(
        category.name,
        slugify(category.name),
        category.emoji,
        category.description,
      ).lastInsertRowid;

      for (const p of category.products) {
        const specs = Object.entries(p.specs).map(([key, value]) => ({ key, value }));
        const slug = slugify(p.name);
        const productId = insertProduct.run(
          p.name,
          slug,
          p.description,
          JSON.stringify(specs),
          p.priceCents,
          p.stock,
          categoryId,
          supplierIds[p.supplier],
          demoImagePath(slug),
          normalizeForSearch(`${p.name} ${p.description}`),
        ).lastInsertRowid;
        for (const key of p.delivery) {
          insertProductDelivery.run(productId, deliveryIds[key]);
        }
      }
    }
  })();

  return { created: true };
}

// Gives the demo products their photo in a database seeded before the photos existed.
// A product that already has an image (e.g. an admin upload) is left alone.
export function attachDemoImages(db) {
  const update = db.prepare('UPDATE products SET image_path = ? WHERE slug = ? AND image_path IS NULL');
  const slugs = CATEGORIES.flatMap((category) => category.products.map((p) => slugify(p.name)));
  let updated = 0;
  db.transaction(() => {
    for (const slug of slugs) {
      updated += update.run(demoImagePath(slug), slug).changes;
    }
  })();
  return { updated };
}
