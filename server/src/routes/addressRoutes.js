const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const c = require('../controllers/addressController');

router.use(protect);

router.get('/', c.getAddresses);
router.post('/', validate({
  full_name: { required: true },
  phone: { required: true, phone: true },
  email: { email: true },
  house: { required: true },
  city: { required: true },
  state: { required: true },
  pin_code: { required: true, maxLen: 10 },
  country: {},
}), c.createAddress);
router.put('/:id', validate({
  phone: { phone: true },
  email: { email: true },
  pin_code: { maxLen: 10 },
}), c.updateAddress);
router.delete('/:id', c.deleteAddress);

module.exports = router;