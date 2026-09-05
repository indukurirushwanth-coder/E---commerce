const AppError = require('../utils/AppError');

const isEmpty = (v) => v === undefined || v === null || v === '';
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
const isPhone = (v) => /^[+]?[\d\s-]{8,15}$/.test(String(v));
const isNumber = (v) => typeof v === 'number' && !Number.isNaN(v);

function validate(fields) {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    for (const [key, rules] of Object.entries(fields)) {
      const value = body[key];
      if (rules.required && isEmpty(value)) {
        errors.push(`${key} is required`);
        continue;
      }
      if (!isEmpty(value)) {
        if (rules.email && !isEmail(value)) errors.push(`${key} must be a valid email`);
        if (rules.phone && !isPhone(value)) errors.push(`${key} must be a valid phone number`);
        if (rules.type === 'number' && !isEmpty(value) && !isNumber(Number(value)))
          errors.push(`${key} must be a number`);
        if (rules.min !== undefined && Number(value) < rules.min)
          errors.push(`${key} must be at least ${rules.min}`);
        if (rules.max !== undefined && Number(value) > rules.max)
          errors.push(`${key} must be at most ${rules.max}`);
        if (rules.oneOf && !rules.oneOf.includes(value))
          errors.push(`${key} must be one of: ${rules.oneOf.join(', ')}`);
        if (rules.maxLen && String(value).length > rules.maxLen)
          errors.push(`${key} must be at most ${rules.maxLen} characters`);
      }
    }
    if (errors.length) {
      return next(new AppError(errors.join('; '), 400));
    }
    next();
  };
}

module.exports = { validate, isEmail, isPhone };