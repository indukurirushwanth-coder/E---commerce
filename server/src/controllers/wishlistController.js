const db = require('../db/connection');
const AppError = require('../utils/AppError');

function getWishlistData(userId) {
  let wishlist = db.prepare('SELECT * FROM wishlist WHERE user_id = ?').get(userId);
  if (!wishlist) {
    const r = db.prepare('INSERT INTO wishlist (user_id) VALUES (?)').run(userId);
    wishlist = { id: r.lastInsertRowid };
  }
  const items = db.prepare(`
    SELECT wi.id, wi.product_id, wi.variant_id, wi.created_at,
           p.name, p.slug, p.price, p.compare_at_price, p.discount_percent, p.stock,
           p.rating_avg, p.rating_count, p.is_published,
           (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image,
           v.name AS variant_name
    FROM wishlist_items wi
    JOIN products p ON p.id = wi.product_id
    LEFT JOIN product_variants v ON v.id = wi.variant_id
    WHERE wi.wishlist_id = ? ORDER BY wi.created_at DESC
  `).all(wishlist.id);
  return { id: wishlist.id, items, count: items.length };
}

exports.getWishlist = (req, res, next) => {
  try {
    res.json({ success: true, data: getWishlistData(req.userId) });
  } catch (err) {
    next(err);
  }
};

exports.addToWishlist = (req, res, next) => {
  try {
    const { product_id, variant_id } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) throw new AppError('Product not found.', 404);

    let wishlist = db.prepare('SELECT * FROM wishlist WHERE user_id = ?').get(req.userId);
    if (!wishlist) {
      const wr = db.prepare('INSERT INTO wishlist (user_id) VALUES (?)').run(req.userId);
      wishlist = { id: Number(wr.lastInsertRowid) };
    }
    const existing = db.prepare('SELECT * FROM wishlist_items WHERE wishlist_id = ? AND product_id = ? AND variant_id IS ?')
      .get(wishlist.id, product_id, variant_id ?? null);
    if (!existing) {
      db.prepare('INSERT INTO wishlist_items (wishlist_id, product_id, variant_id) VALUES (?, ?, ?)')
        .run(wishlist.id, product_id, variant_id ?? null);
    }
    res.json({ success: true, data: getWishlistData(req.userId), message: 'Added to wishlist.' });
  } catch (err) {
    next(err);
  }
};

exports.removeFromWishlist = (req, res, next) => {
  try {
    const { product_id } = req.params;
    const wishlist = db.prepare('SELECT * FROM wishlist WHERE user_id = ?').get(req.userId);
    db.prepare('DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?').run(wishlist.id, product_id);
    res.json({ success: true, data: getWishlistData(req.userId), message: 'Removed from wishlist.' });
  } catch (err) {
    next(err);
  }
};

exports.moveToCart = (req, res, next) => {
  try {
    const { product_id } = req.body;
    const wishlist = db.prepare('SELECT * FROM wishlist WHERE user_id = ?').get(req.userId);
    const item = db.prepare('SELECT * FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?').get(wishlist.id, product_id);
    if (!item) throw new AppError('Item not found in wishlist.', 404);

    const cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.userId);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id IS ?')
      .get(cart.id, product_id, item.variant_id ?? null);
    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?').run(existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, 1, ?)')
        .run(cart.id, product_id, item.variant_id ?? null, product.price);
    }
    db.prepare('DELETE FROM wishlist_items WHERE id = ?').run(item.id);

    res.json({ success: true, data: getWishlistData(req.userId), message: 'Moved to cart.' });
  } catch (err) {
    next(err);
  }
};