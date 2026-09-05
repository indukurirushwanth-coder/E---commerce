const db = require('../db/connection');

exports.getAvailableCoupons = (req, res, next) => {
  try {
    const rows = db.prepare(
      `SELECT id, code, description, type, value, min_order_amount, max_discount_amount, expiry_date, usage_limit, used_count
       FROM coupons WHERE is_active = 1 AND (expiry_date IS NULL OR expiry_date > datetime('now'))
       ORDER BY created_at DESC`
    ).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};