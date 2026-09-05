const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const c = require('../controllers/productController');

const router = express.Router();

router.get('/', optionalAuth, c.getProducts);
router.get('/categories', c.getCategories);
router.get('/brands', c.getBrands);
router.get('/home', c.getHomeData);
router.get('/:slug', c.getProductBySlug);

module.exports = router;