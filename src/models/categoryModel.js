import { withConstraintMessages } from '../utils/errors.js';
import { slugify } from '../utils/text.js';

const MESSAGES = {
  unique: 'A category with this name already exists.',
  foreignKey: 'This category is used by products and cannot be deleted.',
};

export function listCategories(db) {
  return db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.emoji, c.description, COUNT(p.id) AS productCount,
              (SELECT image_path FROM products
               WHERE category_id = c.id AND image_path IS NOT NULL
               ORDER BY id LIMIT 1) AS coverImage
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`,
    )
    .all();
}

export function getCategoryById(db, id) {
  return db.prepare('SELECT id, name, slug, emoji, description FROM categories WHERE id = ?').get(id);
}

export function getCategoryBySlug(db, slug) {
  return db.prepare('SELECT id, name, slug, emoji, description FROM categories WHERE slug = ?').get(slug);
}

export function createCategory(db, { name, emoji, description = '' }) {
  return withConstraintMessages(
    () =>
      db
        .prepare('INSERT INTO categories (name, slug, emoji, description) VALUES (?, ?, ?, ?)')
        .run(name, slugify(name), emoji, description).lastInsertRowid,
    MESSAGES,
  );
}

export function updateCategory(db, id, { name, emoji, description = '' }) {
  withConstraintMessages(
    () =>
      db
        .prepare('UPDATE categories SET name = ?, slug = ?, emoji = ?, description = ? WHERE id = ?')
        .run(name, slugify(name), emoji, description, id),
    MESSAGES,
  );
}

export function deleteCategory(db, id) {
  withConstraintMessages(() => db.prepare('DELETE FROM categories WHERE id = ?').run(id), MESSAGES);
}
