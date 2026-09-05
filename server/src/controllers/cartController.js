const db = require('../db/connection');
const AppError = require('../utils/AppError');

function getCartData(userId) {
  let cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(userId);
  if (!cart) {
    const r = db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);
    cart = { id: r.lastInsertRowid, user_id: userId, coupon_id: null };
  }

  const items = db.prepare(`
    SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity, ci.saved_for_later, ci.price AS line_price,
           p.name, p.slug, p.price AS product_price, p.compare_at_price, p.discount_percent, p.stock,
           (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image,
           v.name AS variant_name, v.color, v.size, v.image AS variant_image
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants v ON v.id = ci.variant_id
    WHERE ci.cart_id = ? ORDER BY ci.created_at DESC
  `).all(cart.id);

  const activeItems = items.filter((i) => !i.saved_for_later);
  const savedItems = items.filter((i) => i.saved_for_later);

  const subtotal = activeItems.reduce((sum, i) => sum + i.line_price * i.quantity, 0);

  let coupon = null;
  let couponDiscount = 0;
  if (cart.coupon_id) {
    coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(cart.coupon_id);
    if (coupon && coupon.is_active && new Date(coupon.expiry_date) > new Date()) {
      if (subtotal >= coupon.min_order_amount) {
        couponDiscount = coupon.type === 'percent'
          ? Math.min(Math.round((subtotal * coupon.value) / 100), coupon.max_discount_amount || Infinity)
          : coupon.value;
        if (subtotal < coupon.min_order_amount) couponDiscount = 0;
      }
      if (subtotal < coupon.min_order_amount) couponDiscount = 0;
    }
  }

  const deliveryFee = new Date().toDateString();
  const itemCount = activeItems.reduce((sum, i) => sum + i.quantity, 0);

  return {
    id: cart.id,
    items: activeItems,
    saved_items: savedItems,
    item_count: itemCount,
    subtotal,
    coupon_discount: couponDiscount,
    coupon: coupon ? { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value } : null,
    delivery_fee: 0,
    tax: Math.round(subtotal * 0.05),
    total: subtotal - couponDiscount + Math.round(subtotal * 0.05),
  };
}

exports.getCart = (req, res, next) => {
  try {
    res.json({ success: true, data: getCartData(req.userId) });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = (req, res, next) => {
  try {
    const { product_id, variant_id, quantity = 1 } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_published = 1').get(product_id);
    if (!product) throw new AppError('Product not found.', 404);

    let cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.userId);
    if (!cart) {
      const cr = db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(req.userId);
      cart = { id: Number(cr.lastInsertRowid) };
    }

    let price = product.price;
    let stock = product.stock;
    if (variant_id) {
      const variant = db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').get(variant_id, product_id);
      if (!variant) throw new AppError('Variant not found.', 404);
      price = variant.price || price;
      stock = variant.stock;
    }

    const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id IS ? AND saved_for_later = 0')
      .get(cart.id, product_id, variant_id ?? null);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > stock) throw new AppError('Requested quantity exceeds available stock.', 400);
      db.prepare('UPDATE cart_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newQty, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)')
        .run(cart.id, product_id, variant_id ?? null, quantity, price);
    }

    res.json({ success: true, data: getCartData(req.userId), message: 'Added to cart.' });
  } catch (err) {
    next(err);
  }
};

exports.updateCartItem = (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = db.prepare('SELECT ci.*, p.stock AS product_stock, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ?').get(req.params.id);
    if (!item) throw new AppError('Cart item not found.', 404);

    let stock = item.product_stock;
    if (item.variant_id) {
      const v = db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(item.variant_id);
      if (v) stock = v.stock;
    }
    if (quantity > stock) throw new AppError('Requested quantity exceeds available stock.', 400);

    if (quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
    } else {
      db.prepare('UPDATE cart_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').run(quantity, item.id);
    }
    res.json({ success: true, data: getCartData(req.userId) });
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = (req, res, next) => {
  try {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
    res.json({ success: true, data: getCartData(req.userId), message: 'Removed from cart.' });
  } catch (err) {
    next(err);
  }
};

exports.toggleSavedForLater = (req, res, next) => {
  try {
    const item = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(req.params.id);
    if (!item) throw new AppError('Cart item not found.', 404);
    db.prepare('UPDATE cart_items SET saved_for_later = ? WHERE id = ?').run(item.saved_for_later ? 0 : 1, item.id);
    res.json({ success: true, data: getCartData(req.userId) });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = (req, res, next) => {
  try {
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.userId);
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
    db.prepare('UPDATE cart SET coupon_id = NULL WHERE id = ?').run(cart.id);
    res.json({ success: true, data: getCartData(req.userId), message: 'Cart cleared.' });
  } catch (err) {
    next(err);
  }
};

exports.applyCoupon = (req, res, next) => {
  try {
    const { code } = req.body;
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code.trim().toUpperCase());
    if (!coupon) throw new AppError('Invalid coupon code.', 400);
    if (!coupon.is_active) throw new AppError('This coupon is not active.', 400);
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) throw new AppError('This coupon has expired.', 400);
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw new AppError('This coupon has reached its usage limit.', 400);

    const uses = db.prepare('SELECT COUNT(*) AS c FROM coupon_usage WHERE coupon_id = ? AND user_id = ?').get(coupon.id, req.userId);
    if (coupon.per_user_limit && uses.c >= coupon.per_user_limit) throw new AppError('You have already used this coupon.', 400);

    const cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.userId);
    db.prepare('UPDATE cart SET coupon_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(coupon.id, cart.id);

    const data = getCartData(req.userId);
    if (data.subtotal < coupon.min_order_amount) {
      db.prepare('UPDATE cart SET coupon_id = NULL WHERE id = ?').run(cart.id);
      throw new AppError(`This coupon requires a minimum order of Rs. ${coupon.min_order_amount}.`, 400);
    }

    res.json({ success: true, data, message: `Coupon ${coupon.code} applied!` });
  } catch (err) {
    next(err);
  }
};

exports.removeCoupon = (req, res, next) => {
  try {
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.userId);
    db.prepare('UPDATE cart SET coupon_id = NULL WHERE id = ?').run(cart.id);
    res.json({ success: true, data: getCartData(req.userId), message: 'Coupon removed.' });
  } catch (err) {
    next(err);
  }
};

exports.validatePin = (req, res, next) => {
  try {
    const { pincode } = req.body;
    const row = db.prepare('SELECT * FROM delivery_pincodes WHERE pincode = ? AND is_active = 1').get(String(pincode));
    if (row) {
      const eta = new Date();
      eta.setDate(eta.getDate() + row.eta_days);
      res.json({
        success: true,
        available: true,
        eta_days: row.eta_days,
        cod_available: !!row.cod_available,
        estimated_delivery: eta.toISOString(),
      });
    } else {
      res.json({ success: true, available: false, message: 'Delivery is not available to this PIN code.' });
    }
  } catch (err) {
    next(err);
  }
};