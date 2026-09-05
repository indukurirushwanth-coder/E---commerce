const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const c = require('../controllers/cartController');

// all cart routes require auth
router.use(protect);

router.get('/', c.getCart);
router.post('/items', validate({ product_id: { required: true, type: 'number' }, quantity: { min: 1 } }), c.addToCart);
router.put('/items/:id', validate({ quantity: { required: true, type: 'number', min: 0 } }), c.updateCartItem);
router.delete('/items/:id', c.removeFromCart);
router.post('/items/:id/save', c.toggleSavedForLater);
router.delete('/', c.clearCart);
router.post('/coupon', validate({ code: { required: true, maxLen: 30 } }), c.applyCoupon);
router.delete('/coupon', c.removeCoupon);
router.post('/validate-pin', validate({ pincode: { required: true, maxLen: 10 } }), c.validatePin);

module.exports = router;