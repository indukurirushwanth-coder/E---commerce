const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const c = require('../controllers/wishlistController');

router.use(protect);

router.get('/', c.getWishlist);
router.post('/items', validate({ product_id: { required: true, type: 'number' } }), c.addToWishlist);
router.delete('/items/:product_id', c.removeFromWishlist);
router.post('/move-to-cart', validate({ product_id: { required: true, type: 'number' } }), c.moveToCart);

module.exports = router;