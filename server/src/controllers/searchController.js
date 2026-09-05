const db = require('../db/connection');

function getImagesForProducts(ids) {
  const images = {};
  if (!ids.length) return images;
  const rows = db.prepare(
    `SELECT product_id, url, alt FROM product_images WHERE product_id IN (${ids.map(() => '?').join(',')}) ORDER BY sort_order`
  ).all(...ids);
  for (const r of rows) {
    if (!images[r.product_id]) images[r.product_id] = [];
    images[r.product_id].push({ url: r.url, alt: r.alt });
  }
  return images;
}

exports.suggestions = (req, res, next) => {
  try {
    const { q } = req.query;
    const like = `%${q || ''}%`;
    const products = db.prepare(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.discount_percent, p.rating_avg, p.stock, b.name AS brand_name
       FROM products p LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.is_published = 1 AND (p.name LIKE ? OR b.name LIKE ?)
       LIMIT 6`
    ).all(like, like);
    const ids = products.map((p) => p.id);
    const images = getImagesForProducts(ids);
    const productData = products.map((p) => ({ ...p, image: (images[p.id] && images[p.id][0]?.url) || null }));

    const categories = db.prepare(
      `SELECT name, slug FROM categories WHERE is_active = 1 AND name LIKE ? LIMIT 4`
    ).all(like);
    const brands = db.prepare(
      `SELECT name, slug FROM brands WHERE name LIKE ? LIMIT 4`
    ).all(like);

    // record search history for logged-in user
    if (req.userId && q && q.trim().length >= 2) {
      db.prepare('INSERT INTO search_history (user_id, query) VALUES (?, ?)').run(req.userId, q.trim());
    }

    res.json({ success: true, data: { products: productData, categories, brands } });
  } catch (err) {
    next(err);
  }
};

exports.recentSearches = (req, res, next) => {
  try {
    if (!req.userId) return res.json({ success: true, data: [] });
    const rows = db.prepare(
      `SELECT query, MAX(created_at) as last_seen FROM search_history WHERE user_id = ?
       GROUP BY query ORDER BY last_seen DESC LIMIT 8`
    ).all(req.userId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.clearHistory = (req, res, next) => {
  try {
    db.prepare('DELETE FROM search_history WHERE user_id = ?').run(req.userId);
    res.json({ success: true, message: 'Search history cleared.' });
  } catch (err) {
    next(err);
  }
};

// Quick global search used by the search page initial load
exports.globalSearch = (req, res, next) => {
  try {
    const { q } = req.query;
    const like = `%${q || ''}%`;
    const rows = db.prepare(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.discount_percent, p.rating_avg, p.reviews_count, p.stock
       FROM products p WHERE p.is_published = 1 AND p.name LIKE ? ORDER BY p.sold_count DESC LIMIT 20`
    ).all(like);
    const ids = rows.map((p) => p.id);
    const images = getImagesForProducts(ids);
    res.json({
      success: true,
      data: rows.map((p) => ({ ...p, image: (images[p.id] && images[p.id][0]?.url) || null })),
    });
  } catch (err) {
    next(err);
  }
};