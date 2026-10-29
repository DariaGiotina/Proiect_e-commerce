import { normalizeForSearch, slugify } from '../utils/text.js';

function uniqueSlug(db, name, ignoreId = null) {
  const base = slugify(name) || 'product';
  const taken = db.prepare('SELECT 1 FROM products WHERE slug = ? AND id IS NOT ?');
  let slug = base;
  for (let n = 2; taken.get(slug, ignoreId); n += 1) {
    slug = `${base}-${n}`;
  }
  return slug;
}

function replaceDeliveryLinks(db, productId, deliveryMethodIds) {
  db.prepare('DELETE FROM product_delivery_methods WHERE product_id = ?').run(productId);
  const insert = db.prepare(
    'INSERT INTO product_delivery_methods (product_id, delivery_method_id) VALUES (?, ?)',
  );
  for (const id of deliveryMethodIds) insert.run(productId, id);
}

export function createProduct(db, input) {
  return db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO products
           (name, slug, description, specs_json, price_cents, stock, category_id, supplier_id, image_path, search_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.name,
        uniqueSlug(db, input.name),
        input.description,
        JSON.stringify(input.specs),
        input.priceCents,
        input.stock,
        input.categoryId,
        input.supplierId,
        input.imagePath ?? null,
        normalizeForSearch(`${input.name} ${input.description}`),
      );
    replaceDeliveryLinks(db, lastInsertRowid, input.deliveryMethodIds);
    return lastInsertRowid;
  })();
}

// Leaving imagePath undefined keeps the current image.
export function updateProduct(db, id, input) {
  db.transaction(() => {
    db.prepare(
      `UPDATE products
       SET name = ?, slug = ?, description = ?, specs_json = ?, price_cents = ?, stock = ?,
           category_id = ?, supplier_id = ?, image_path = COALESCE(?, image_path),
           search_text = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      input.name,
      uniqueSlug(db, input.name, id),
      input.description,
      JSON.stringify(input.specs),
      input.priceCents,
      input.stock,
      input.categoryId,
      input.supplierId,
      input.imagePath ?? null,
      normalizeForSearch(`${input.name} ${input.description}`),
      id,
    );
    replaceDeliveryLinks(db, id, input.deliveryMethodIds);
  })();
}

export function deleteProduct(db, id) {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

const DETAIL_SQL = `
  SELECT p.id, p.name, p.slug, p.description, p.specs_json, p.price_cents, p.stock, p.image_path,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug, c.emoji AS category_emoji,
         s.id AS supplier_id, s.name AS supplier_name
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN suppliers s ON s.id = p.supplier_id`;

function toProductDetail(db, row) {
  if (!row) return undefined;
  const deliveryMethods = db
    .prepare(
      `SELECT d.id, d.name, d.price_cents AS priceCents, d.eta
       FROM product_delivery_methods pdm
       JOIN delivery_methods d ON d.id = pdm.delivery_method_id
       WHERE pdm.product_id = ?
       ORDER BY d.price_cents`,
    )
    .all(row.id);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    specs: JSON.parse(row.specs_json),
    priceCents: row.price_cents,
    stock: row.stock,
    imagePath: row.image_path,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug, emoji: row.category_emoji },
    supplier: { id: row.supplier_id, name: row.supplier_name },
    deliveryMethods,
  };
}

export function getProductById(db, id) {
  return toProductDetail(db, db.prepare(`${DETAIL_SQL} WHERE p.id = ?`).get(id));
}

export function getProductBySlug(db, slug) {
  return toProductDetail(db, db.prepare(`${DETAIL_SQL} WHERE p.slug = ?`).get(slug));
}

export function listProductsForAdmin(db) {
  return db
    .prepare(
      `SELECT p.id, p.name, p.slug, p.price_cents AS priceCents, p.stock, p.image_path AS imagePath,
              c.name AS categoryName, c.emoji AS categoryEmoji
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ORDER BY p.name`,
    )
    .all();
}
