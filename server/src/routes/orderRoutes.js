const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const c = require('../controllers/orderController');

router.use(protect);

router.get('/', c.getMyOrders);
router.get('/invoice/:id', c.getInvoice);
router.get('/tracking/:id', c.getTracking);
router.get('/:id', c.getOrder);
router.post('/:id/cancel', validate({ reason: { maxLen: 500 } }), c.cancelOrder);
router.post('/:id/return', validate({ reason: { maxLen: 500 } }), c.requestReturn);

module.exports = router;