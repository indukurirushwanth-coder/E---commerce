const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { JWT_SECRET } = require('../config');
const AppError = require('../utils/AppError');
const { sanitizeUser } = require('../utils/helpers');

function getUserRecord(userId) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return row;
}

const protect = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      throw new AppError('Not authenticated. Please log in.', 401);
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserRecord(decoded.id);
    if (!user) {
      throw new AppError('User no longer exists.', 401);
    }
    if (user.is_blocked) {
      throw new AppError('Your account has been blocked. Contact support.', 403);
    }
    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }
    next(err);
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }
  next();
};

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = getUserRecord(decoded.id);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    } catch (_) {
      // ignore invalid token
    }
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };