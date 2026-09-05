const router = require('express').Router();
const { optionalAuth, protect } = require('../middleware/auth');
const c = require('../controllers/searchController');

router.get('/suggest', optionalAuth, c.suggestions);
router.get('/recent', protect, c.recentSearches);
router.delete('/history', protect, c.clearHistory);
router.get('/global', c.globalSearch);

module.exports = router;