const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const c = require('../controllers/checkoutController');

router.post('/init', protect, c.initCheckout);
router.post('/place', protect, validate({
  address_id: { required: true, type: 'number' },
  payment_method: { required: true, oneOf: ['upi', 'card', 'netbanking', 'cod', 'wallet'] },
}), c.placeOrder);
router.post('/webhook/payment', c.onPaymentWebhook);

module.exports = router;