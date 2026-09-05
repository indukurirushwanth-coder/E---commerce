const db = require('../db/connection');
const AppError = require('../utils/AppError');

exports.getProductReviews = (req, res, next) => {
  try {
    const rows = db.prepare(
      `SELECT r.*, u.full_name, u.avatar,
        (SELECT SUM(is_helpful) FROM review_helpful WHERE review_id = r.id) as helpful_count,
        (SELECT SUM(1 - is_helpful) FROM review_helpful WHERE review_id = r.id) as not_helpful_count
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.status = 1
       ORDER BY r.created_at DESC LIMIT 100`
    ).all(req.params.productId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.createReview = (req, res, next) => {
  try {
    const { product_id, rating, title, body, images, order_item_id } = req.body;

    // Must have purchased to review
    const purchased = order_item_id
      ? db.prepare(`SELECT oi.* FROM order_items oi JOIN orders o ON o.id = oi.order_id
                    WHERE oi.id = ? AND o.user_id = ? AND o.status = 'delivered'`).get(order_item_id, req.userId)
      : db.prepare(`SELECT oi.id FROM order_items oi JOIN orders o ON o.id = oi.order_id
                    WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered' LIMIT 1`).get(product_id, req.userId);
    if (!purchased) throw new AppError('You can only review products you have purchased and received.', 403);

    const existing = db.prepare('SELECT * FROM reviews WHERE user_id = ? AND product_id = ?').get(req.userId, product_id);
    if (existing) throw new AppError('You have already reviewed this product.', 409);

    const r = db.prepare(`INSERT INTO reviews (product_id, user_id, order_item_id, rating, title, body, images, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`)
      .run(product_id, req.userId, purchased.id, rating, title || null, body || null, images ? JSON.stringify(images) : null);

    // update product rating
    const stats = db.prepare('SELECT COUNT(*) AS c, AVG(rating) AS avg FROM reviews WHERE product_id = ? AND status = 1').get(product_id);
    db.prepare('UPDATE products SET rating_avg = ?, rating_count = ?, reviews_count = ? WHERE id = ?')
      .run(Math.round(stats.avg * 10) / 10, stats.c, stats.c, product_id);

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json({ success: true, data: review, message: 'Review submitted. Thank you!' });
  } catch (err) {
    next(err);
  }
};

exports.markHelpful = (req, res, next) => {
  try {
    const { helpful } = req.body;
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review) throw new AppError('Review not found.', 404);
    const existing = db.prepare('SELECT * FROM review_helpful WHERE review_id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (existing) {
      db.prepare('DELETE FROM review_helpful WHERE id = ?').run(existing.id);
    }
    db.prepare('INSERT INTO review_helpful (review_id, user_id, is_helpful) VALUES (?, ?, ?)').run(req.params.id, req.userId, helpful ? 1 : 0);
    const review_helpful_count = db.prepare('SELECT IFNULL(SUM(is_helpful),0) AS h, IFNULL(SUM(1-is_helpful),0) AS nh FROM review_helpful WHERE review_id = ?').get(req.params.id);
    res.json({ success: true, data: { helpful_count: review_helpful_count.h || 0, not_helpful_count: review_helpful_count.nh || 0 }, message: 'Thanks for your feedback!' });
  } catch (err) {
    next(err);
  }
};

exports.canReview = (req, res, next) => {
  try {
    const productId = req.params.productId;
    const orderItem = db.prepare(`SELECT oi.id, oi.order_id, oi.product_name FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered' ORDER BY o.created_at DESC LIMIT 1`)
      .get(productId, req.userId);
    const existingId = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?').get(req.userId, productId);
    res.json({ success: true, data: { can_review: !!orderItem && !existingId, order_item_id: orderItem?.id } });
  } catch (err) {
    next(err);
  }
};