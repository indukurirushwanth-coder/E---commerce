const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/couponController');

router.get('/available', protect, c.getAvailableCoupons);

module.exports = router;