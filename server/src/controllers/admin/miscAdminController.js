const db = require('../../db/connection');
const AppError = require('../../utils/AppError');

exports.listCoupons = (req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = (req, res, next) => {
  try {
    const { code, description, type, value, min_order_amount, max_discount_amount, expiry_date, usage_limit, per_user_limit, is_active } = req.body;
    if (db.prepare('SELECT id FROM coupons WHERE code = ?').get(code)) throw new AppError('Coupon code already exists.', 409);
    if (!['percent', 'fixed'].includes(type)) throw new AppError('Type must be percent or fixed.', 400);
    if (type === 'percent' && (value < 0 || value > 100)) throw new AppError('Percent discount must be between 0 and 100.', 400);
    const r = db.prepare(`INSERT INTO coupons (code, description, type, value, min_order_amount, max_discount_amount, expiry_date, usage_limit, per_user_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(code.toUpperCase(), description || null, type, value, min_order_amount ?? 0, max_discount_amount || null,
        expiry_date || null, usage_limit ?? 0, per_user_limit ?? 1, is_active === undefined ? 1 : is_active ? 1 : 0);
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid }, message: 'Coupon created.' });
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
    if (!existing) throw new AppError('Coupon not found.', 404);
    const { code, description, type, value, min_order_amount, max_discount_amount, expiry_date, usage_limit, per_user_limit, is_active } = req.body;
    db.prepare(`UPDATE coupons SET code = ?, description = ?, type = ?, value = ?, min_order_amount = ?, max_discount_amount = ?,
      expiry_date = ?, usage_limit = ?, per_user_limit = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`)
      .run((code || existing.code).toUpperCase(), description ?? existing.description, type ?? existing.type,
        value ?? existing.value, min_order_amount ?? existing.min_order_amount, max_discount_amount ?? existing.max_discount_amount,
        expiry_date ?? existing.expiry_date, usage_limit ?? existing.usage_limit, per_user_limit ?? existing.per_user_limit,
        is_active === undefined ? existing.is_active : is_active ? 1 : 0, req.params.id);
    res.json({ success: true, message: 'Coupon updated.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = (req, res, next) => {
  try {
    db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.getInventory = (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT p.id, p.name, p.sku, p.stock, p.low_stock_threshold, p.rating_avg, p.sold_count,
        (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image,
        CASE WHEN p.stock <= 0 THEN 'out_of_stock' WHEN p.stock <= p.low_stock_threshold THEN 'low_stock' ELSE 'in_stock' END AS status
      FROM products p ORDER BY p.stock ASC
    `).all();
    const low = rows.filter((r) => r.status === 'low_stock');
    const out = rows.filter((r) => r.status === 'out_of_stock');
    res.json({ success: true, data: { products: rows, low, out } });
  } catch (err) {
    next(err);
  }
};

exports.adjustStock = (req, res, next) => {
  try {
    const { product_id, quantity, reason } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) throw new AppError('Product not found.', 404);
    const newStock = Math.max(0, product.stock + Number(quantity));
    db.prepare('UPDATE products SET stock = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newStock, product_id);
    db.prepare('INSERT INTO inventory (product_id, quantity_change, reason, new_stock, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(product_id, Number(quantity), reason || 'manual_adjustment', newStock, req.userId);
    res.json({ success: true, data: { id: product_id, stock: newStock }, message: 'Stock adjusted.' });
  } catch (err) {
    next(err);
  }
};

exports.getInventoryHistory = (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT inv.*, p.name AS product_name, u.full_name AS created_by_name
      FROM inventory inv JOIN products p ON p.id = inv.product_id
      LEFT JOIN users u ON u.id = inv.created_by
      ORDER BY inv.created_at DESC LIMIT 100
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.listBrands = (req, res, next) => {
  try {
    const rows = db.prepare('SELECT b.*, COUNT(p.id) AS product_count FROM brands b LEFT JOIN products p ON p.brand_id = b.id GROUP BY b.id ORDER BY product_count DESC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.createBrand = (req, res, next) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (db.prepare('SELECT id FROM brands WHERE name = ?').get(name)) throw new AppError('Brand already exists.', 409);
    const r = db.prepare('INSERT INTO brands (name, slug) VALUES (?, ?)').run(name, slug);
    res.status(201).json({ success: true, data: { id: r.lastInsertRowid }, message: 'Brand created.' });
  } catch (err) {
    next(err);
  }
};

exports.updateBrand = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
    if (!existing) throw new AppError('Brand not found.', 404);
    const name = req.body.name || existing.name;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    db.prepare('UPDATE brands SET name = ?, slug = ? WHERE id = ?').run(name, slug, req.params.id);
    res.json({ success: true, message: 'Brand updated.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteBrand = (req, res, next) => {
  try {
    const count = db.prepare('SELECT COUNT(*) AS c FROM products WHERE brand_id = ?').get(req.params.id).c;
    if (count > 0) throw new AppError('Cannot delete a brand that has products.', 409);
    db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Brand deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.seedPincodes = (req, res, next) => {
  try {
    const pins = ['110001', '110002', '400001', '400002', '560001', '560002', '600001', '700001', '500001', '380001', '411001', '226001', '282001', '201301', '302001', '400050', '560034', '600028'];
    const stmt = db.prepare('INSERT OR IGNORE INTO delivery_pincodes (pincode, eta_days, cod_available) VALUES (?, ?, 1)');
    pins.forEach((p, i) => stmt.run(p, 2 + (i % 4)));
    res.json({ success: true, message: `${pins.length} pincodes seeded.` });
  } catch (err) {
    next(err);
  }
};