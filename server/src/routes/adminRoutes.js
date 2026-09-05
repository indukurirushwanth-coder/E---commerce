const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const analytics = require('../controllers/admin/analyticsController');
const products = require('../controllers/admin/productAdminController');
const categories = require('../controllers/admin/categoryAdminController');
const orders = require('../controllers/admin/orderAdminController');
const misc = require('../controllers/admin/miscAdminController');

router.use(protect, adminOnly);

// Analytics
router.get('/analytics/dashboard', analytics.getDashboard);
router.get('/analytics', analytics.getAnalytics);

// Products
router.get('/products', products.listProducts);
router.get('/products/:id', products.getProduct);
router.post('/products', validate({ name: { required: true }, price: { required: true, type: 'number' }, category_id: { required: true, type: 'number' } }), products.createProduct);
router.put('/products/:id', products.updateProduct);
router.delete('/products/:id', products.deleteProduct);
router.post('/products/:id/publish', products.togglePublish);

// Categories
router.get('/categories', categories.listCategories);
router.post('/categories', validate({ name: { required: true } }), categories.createCategory);
router.put('/categories/:id', categories.updateCategory);
router.delete('/categories/:id', categories.deleteCategory);

// Orders
router.get('/orders', orders.listOrders);
router.get('/orders/:id', orders.getOrder);
router.put('/orders/:id/status', validate({ status: { required: true, oneOf: ['ordered', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'] } }), orders.updateStatus);
router.get('/orders/:id/invoice', orders.getInvoice);
router.get('/customers', orders.listCustomers);
router.get('/customers/:id', orders.getCustomer);
router.put('/customers/:id/block', orders.toggleBlock);

// Coupons
router.get('/coupons', misc.listCoupons);
router.post('/coupons', validate({ code: { required: true, maxLen: 30 }, value: { required: true, type: 'number' } }), misc.createCoupon);
router.put('/coupons/:id', misc.updateCoupon);
router.delete('/coupons/:id', misc.deleteCoupon);

// Inventory
router.get('/inventory', misc.getInventory);
router.post('/inventory/adjust', validate({ product_id: { required: true, type: 'number' }, quantity: { required: true, type: 'number' } }), misc.adjustStock);
router.get('/inventory/history', misc.getInventoryHistory);

// Brands
router.get('/brands', misc.listBrands);
router.post('/brands', validate({ name: { required: true } }), misc.createBrand);
router.put('/brands/:id', misc.updateBrand);
router.delete('/brands/:id', misc.deleteBrand);
router.post('/pincodes/seed', misc.seedPincodes);

module.exports = router;