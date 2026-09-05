const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const c = require('../controllers/reviewController');

router.get('/product/:productId', c.getProductReviews);
router.get('/product/:productId/can-review', protect, c.canReview);
router.post('/', protect, validate({
  product_id: { required: true, type: 'number' },
  rating: { required: true, type: 'number', min: 1, max: 5 },
  title: { maxLen: 200 },
  body: { maxLen: 2000 },
}), c.createReview);
router.post('/:id/helpful', protect, validate({ helpful: { type: 'number' } }), c.markHelpful);

module.exports = router;