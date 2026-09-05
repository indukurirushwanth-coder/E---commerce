const db = require('../../db/connection');
const AppError = require('../../utils/AppError');
const { slugify } = require('../../utils/helpers');

exports.listCategories = (req, res, next) => {
  try {
    const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
    const withCounts = cats.map((c) => ({
      ...c,
      product_count: db.prepare(`SELECT COUNT(*) AS c FROM products WHERE category_id = ? OR category_id IN (SELECT id FROM categories WHERE parent_id = ?)`).get(c.id, c.id).c,
    }));
    res.json({ success: true, data: withCounts });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = (req, res, next) => {
  try {
    const { name, description, image, parent_id, sort_order, is_active } = req.body;
    const slug = slugify(name);
    if (db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)) {
      throw new AppError('A category with this name already exists.', 409);
    }
    const r = db.prepare('INSERT INTO categories (name, slug, description, image, parent_id, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(name, slug, description || null, image || null, parent_id || null, sort_order ?? 0, is_active === undefined ? 1 : is_active ? 1 : 0);
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid }, message: 'Category created.' });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) throw new AppError('Category not found.', 404);
    const { name, description, image, parent_id, sort_order, is_active } = req.body;
    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = slugify(name);
      if (db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(slug, req.params.id)) {
        throw new AppError('A category with this name already exists.', 409);
      }
    }
    db.prepare(`UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, parent_id = ?, sort_order = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(name ?? existing.name, slug, description ?? existing.description, image ?? existing.image,
        parent_id === undefined ? existing.parent_id : parent_id, sort_order ?? existing.sort_order,
        is_active === undefined ? existing.is_active : is_active ? 1 : 0, req.params.id);
    res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) throw new AppError('Category not found.', 404);
    const products = db.prepare('SELECT COUNT(*) AS c FROM products WHERE category_id = ?').get(req.params.id).c;
    const children = db.prepare('SELECT COUNT(*) AS c FROM categories WHERE parent_id = ?').get(req.params.id).c;
    if (products > 0 || children > 0) {
      throw new AppError('Cannot delete a category that has products or subcategories. Move them first.', 409);
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
};