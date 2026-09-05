const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/connection');
const config = require('../config');
const AppError = require('../utils/AppError');
const { sanitizeUser } = require('../utils/helpers');
const { sendMail } = require('../utils/mailer');

const signToken = (id) => jwt.sign({ id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

exports.register = async (req, res, next) => {
  try {
    const { full_name, email, phone, password } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) throw new AppError('An account with this email already exists.', 409);

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      `INSERT INTO users (full_name, email, phone, password_hash, role, email_verified)
       VALUES (?, ?, ?, ?, 'customer', 0)`
    ).run(full_name, email, phone, hash);
    const userId = result.lastInsertRowid;

    db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);
    db.prepare('INSERT INTO wishlist (user_id) VALUES (?)').run(userId);

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expires);

    const link = `${config.FRONTEND_URL}/verify-email?token=${token}`;
    await sendMail({
      to: email,
      subject: 'Verify your ShopX account',
      text: `Welcome to ShopX! Verify your email using this link: ${link}`,
    });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email.',
      user: sanitizeUser(user),
      token: signToken(userId),
      verifyLink: link,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new AppError('Invalid email or password.', 401);
    }
    if (user.is_blocked) {
      throw new AppError('Your account has been blocked. Please contact support.', 403);
    }
    res.json({
      success: true,
      user: sanitizeUser(user),
      token: signToken(user.id),
      message: user.email_verified ? 'Welcome back!' : 'Please verify your email to access all features.',
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res, next) => {
  try {
    const user = db.prepare('SELECT id, full_name, email, phone, role, avatar, email_verified, created_at FROM users WHERE id = ?').get(req.userId);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = (req, res, next) => {
  try {
    const { full_name, phone, avatar } = req.body;
    const fields = [];
    const values = [];
    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
    if (!fields.length) throw new AppError('Nothing to update.', 400);
    fields.push('updated_at = datetime(\'now\')');
    values.push(req.userId);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const user = db.prepare('SELECT id, full_name, email, phone, role, avatar, email_verified, created_at FROM users WHERE id = ?').get(req.userId);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    if (!bcrypt.compareSync(old_password, user.password_hash)) {
      throw new AppError('Current password is incorrect.', 401);
    }
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, req.userId);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expires);
    const link = `${config.FRONTEND_URL}/reset-password?token=${token}`;
    await sendMail({ to: email, subject: 'Reset your ShopX password', text: `Reset link: ${link}` });
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.', resetLink: link });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = (req, res, next) => {
  try {
    const { token, new_password } = req.body;
    const record = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').get(token);
    if (!record) throw new AppError('Invalid or expired reset token.', 400);
    if (new Date(record.expires_at) < new Date()) throw new AppError('Reset token has expired.', 400);
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, record.user_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(record.id);
    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = (req, res, next) => {
  try {
    const { token } = req.body;
    const record = db.prepare('SELECT * FROM email_verifications WHERE token = ? AND used = 0').get(token);
    if (!record) throw new AppError('Invalid or expired verification token.', 400);
    if (new Date(record.expires_at) < new Date()) throw new AppError('Verification token has expired.', 400);
    db.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').run(record.id);
    db.prepare('UPDATE users SET email_verified = 1, updated_at = datetime(\'now\') WHERE id = ?').run(record.user_id);
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.resendVerification = (req, res, next) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (user.email_verified) throw new AppError('Email is already verified.', 400);
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expires);
    const link = `${config.FRONTEND_URL}/verify-email?token=${token}`;
    res.json({ success: true, message: 'Verification email sent.', verifyLink: link });
  } catch (err) {
    next(err);
  }
};