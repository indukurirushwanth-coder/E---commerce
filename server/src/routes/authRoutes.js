const express = require('express');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const c = require('../controllers/authController');

const router = express.Router();

router.post('/register', validate({
  full_name: { required: true, maxLen: 100 },
  email: { required: true, email: true },
  phone: { required: false, phone: true },
  password: { required: true, min: 6, maxLen: 100 },
}), c.register);

router.post('/login', validate({
  email: { required: true, email: true },
  password: { required: true },
}), c.login);

router.get('/me', protect, c.getMe);
router.put('/profile', protect, validate({ full_name: { maxLen: 100 }, phone: { phone: true } }), c.updateProfile);
router.put('/change-password', protect, validate({
  old_password: { required: true },
  new_password: { required: true, min: 6 },
}), c.changePassword);

router.post('/forgot-password', validate({ email: { required: true, email: true } }), c.forgotPassword);
router.post('/reset-password', validate({ token: { required: true }, new_password: { required: true, min: 6 } }), c.resetPassword);
router.post('/verify-email', validate({ token: { required: true } }), c.verifyEmail);
router.post('/resend-verification', protect, c.resendVerification);

module.exports = router;