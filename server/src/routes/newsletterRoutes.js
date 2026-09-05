const router = require('express').Router();
const db = require('../db/connection');
const { validate } = require('../middleware/validate');

router.post('/subscribe', validate({ email: { required: true, email: true } }), (req, res, next) => {
  try {
    db.prepare('INSERT OR IGNORE INTO newsletters (email) VALUES (?)').run(req.body.email);
    res.json({ success: true, message: 'Subscribed! Look out for great deals in your inbox.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;