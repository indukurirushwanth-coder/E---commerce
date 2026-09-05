const db = require('../../db/connection');
const AppError = require('../../utils/AppError');
const { slugify } = require('../../utils/helpers');

exports.listProducts = (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT p.*, b.name AS brand_name, c.name AS category_name,
        (SELECT COUNT(pi.id) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = (req, res, next) => {
  try {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!p) throw new AppError('Product not found.', 404);
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(p.id);
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);
    res.json({ success: true, data: { ...p, specifications: p.specifications ? JSON.parse(p.specifications) : null, images, variants } });
  } catch (err) {
    next(err);
  }
};

function upsertProductImages(productId, images) {
  if (!Array.isArray(images)) return;
  db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);
  images.forEach((img, i) => {
    const url = typeof img === 'string' ? img : img.url;
    const alt = typeof img === 'string' ? null : img.alt;
    db.prepare('INSERT INTO product_images (product_id, url, alt, sort_order) VALUES (?, ?, ?, ?)').run(productId, url, alt || null, i);
  });
}

function upsertVariants(productId, variants, sku) {
  db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
  (variants || []).forEach((v, i) => {
    db.prepare(`INSERT INTO product_variants (product_id, sku, name, color, size, price, compare_at_price, stock, image, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
      .run(productId, v.sku || `${sku}-${i + 1}`, v.name || null, v.color || null, v.size || null,
        v.price || null, v.compare_at_price || null, v.stock ?? 0, v.image || null);
  });
}

exports.createProduct = (req, res, next) => {
  try {
    const body = req.body;
    const slug = slugify(body.name || 'product');
    const uniqueSlug = db.prepare('SELECT COUNT(*) AS c FROM products WHERE slug = ?').get(slug).c === 0
      ? slug : `${slug}-${Date.now().toString(36)}`;

    const sku = body.sku || `SKU-${Date.now().toString(36).toUpperCase()}`;
    const compareAt = body.compare_at_price || body.price;
    const discountPercent = body.discount_percent || (body.price && body.compare_at_price
      ? Math.round(((body.compare_at_price - body.price) / body.compare_at_price) * 100) : 0);

    const r = db.prepare(`INSERT INTO products
      (name, slug, description, sku, brand_id, category_id, price, compare_at_price, cost_price, discount_percent,
       stock, low_stock_threshold, weight, dimensions, is_published, is_featured, is_trending, is_best_seller, is_new,
       tags, specifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      body.name, uniqueSlug, body.description || '', sku, body.brand_id || null, body.category_id,
      body.price, compareAt, body.cost_price || null, discountPercent,
      body.stock ?? 0, body.low_stock_threshold ?? 5, body.weight || null, body.dimensions || null,
      body.is_published ? 1 : 0, body.is_featured ? 1 : 0, body.is_trending ? 1 : 0,
      body.is_best_seller ? 1 : 0, body.is_new ? 1 : 0, body.tags || null,
      body.specifications ? JSON.stringify(body.specifications) : null
    );
    const productId = Number(r.lastInsertRowid);

    upsertProductImages(productId, body.images || []);
    upsertVariants(productId, body.variants || [], sku);

    if (body.stock > 0) {
      db.prepare('INSERT INTO inventory (product_id, quantity_change, reason, new_stock, created_by) VALUES (?, ?, ?, ?, ?)')
        .run(productId, body.stock, 'initial_stock', body.stock, req.userId);
    }

    res.status(201).json({ success: true, data: { id: productId }, message: 'Product created.' });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) throw new AppError('Product not found.', 404);
    const body = req.body;
    const fields = [];
    const values = [];
    const map = {
      name: 'name', description: 'description', sku: 'sku', brand_id: 'brand_id', category_id: 'category_id',
      price: 'price', compare_at_price: 'compare_at_price', cost_price: 'cost_price', stock: 'stock',
      low_stock_threshold: 'low_stock_threshold', is_published: 'is_published', is_featured: 'is_featured',
      is_trending: 'is_trending', is_best_seller: 'is_best_seller', is_new: 'is_new', tags: 'tags',
      weight: 'weight', dimensions: 'dimensions',
    };
    for (const [key, col] of Object.entries(map)) {
      if (body[key] !== undefined) {
        if (typeof body[key] === 'boolean') {
          fields.push(`${col} = ?`); values.push(body[key] ? 1 : 0);
        } else {
          fields.push(`${col} = ?`); values.push(body[key]);
        }
      }
    }
    if (body.name) {
      const slug = slugify(body.name);
      const clash = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(slug, req.params.id);
      fields.push('slug = ?');
      values.push(clash ? `${slug}-${Date.now().toString(36)}` : slug);
    }
    if (body.specifications !== undefined) {
      fields.push('specifications = ?');
      values.push(typeof body.specifications === 'string' ? body.specifications : JSON.stringify(body.specifications));
    }
    // recompute discount if both prices set
    if (body.price !== undefined && body.compare_at_price !== undefined && body.compare_at_price > body.price) {
      const disc = Math.round(((body.compare_at_price - body.price) / body.compare_at_price) * 100);
      fields.push('discount_percent = ?'); values.push(disc);
    }
    fields.push(`updated_at = datetime('now')`);
    values.push(req.params.id);
    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    if (body.images !== undefined) upsertProductImages(req.params.id, body.images);
    if (body.variants !== undefined) upsertVariants(req.params.id, body.variants, existing.sku || body.sku);

    res.json({ success: true, message: 'Product updated.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) throw new AppError('Product not found.', 404);
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.togglePublish = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) throw new AppError('Product not found.', 404);
    const publish = req.body.is_published ? 1 : 0;
    db.prepare('UPDATE products SET is_published = ?, updated_at = datetime(\'now\') WHERE id = ?').run(publish, req.params.id);
    res.json({ success: true, message: publish ? 'Product published.' : 'Product unpublished.' });
  } catch (err) {
    next(err);
  }
};