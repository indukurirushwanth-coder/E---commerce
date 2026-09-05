const db = require('../db/connection');
const AppError = require('../utils/AppError');

exports.getAddresses = (req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.userId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.createAddress = (req, res, next) => {
  try {
    const { full_name, phone, email, house, city, state, pin_code, country, is_default } = req.body;
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.userId);
    }
    const r = db.prepare(
      'INSERT INTO addresses (user_id, full_name, phone, email, house, city, state, pin_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.userId, full_name, phone, email, house, city, state, pin_code, country || 'India', is_default ? 1 : 0);
    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json({ success: true, data: address, message: 'Address added.' });
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) throw new AppError('Address not found.', 404);
    const { full_name, phone, email, house, city, state, pin_code, country, is_default } = req.body;

    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.userId);
    }
    db.prepare(`UPDATE addresses SET full_name = ?, phone = ?, email = ?, house = ?, city = ?, state = ?, pin_code = ?, country = ?, is_default = ?, updated_at = datetime('now')
      WHERE id = ?`)
      .run(full_name ?? existing.full_name, phone ?? existing.phone, email ?? existing.email,
        house ?? existing.house, city ?? existing.city, state ?? existing.state,
        pin_code ?? existing.pin_code, country ?? existing.country, is_default ? 1 : existing.is_default, req.params.id);
    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: address, message: 'Address updated.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) throw new AppError('Address not found.', 404);
    db.prepare('DELETE FROM addresses WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Address deleted.' });
  } catch (err) {
    next(err);
  }
};