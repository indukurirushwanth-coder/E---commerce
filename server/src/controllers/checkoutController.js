const db = require('../db/connection');
const config = require('../config');
const AppError = require('../utils/AppError');
const { genOrderNumber } = require('../utils/helpers');
const { sendMail } = require('../utils/mailer');
const crypto = require('crypto');

const TAX_RATE = 0.05;
const FREE_DELIVERY_THRESHOLD = 999;
const DELIVERY_FEE = 49;

function getCartSnapshot(userId) {
  const cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(userId);
  if (!cart) throw new AppError('No cart found.', 400);
  const items = db.prepare(`
    SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity, ci.price AS line_price,
           p.name, p.price, p.compare_at_price, p.stock,
           (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image,
           v.name AS variant_name, v.stock AS variant_stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants v ON v.id = ci.variant_id
    WHERE ci.cart_id = ? AND ci.saved_for_later = 0
  `).all(cart.id);
  return { cart, items };
}

function computeTotals(items, coupon) {
  const subtotal = items.reduce((s, i) => s + i.line_price * i.quantity, 0);
  let discount = 0;
  if (coupon && coupon.is_active && new Date(coupon.expiry_date) > new Date() && subtotal >= coupon.min_order_amount) {
    discount = coupon.type === 'percent'
      ? Math.min(Math.round((subtotal * coupon.value) / 100), coupon.max_discount_amount || Infinity)
      : coupon.value;
  }
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * TAX_RATE);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = taxable + tax + deliveryFee;
  return { subtotal, discount, tax, deliveryFee, total };
}

// Payment gateway abstraction — server-side only.
async function createPaymentIntent(gateway, orderId, amount, method) {
  // In production integrate with Razorpay / Stripe here.
  // E.g. razorpay.orders.create({ amount: amount*100, currency: 'INR', receipt: orderId });
  // Never touch or store raw card data — payment happens on the gateway's secure page / SDK.
  let mod = null;
  try {
    mod = require('razorpay');
  } catch (_) {
    mod = null;
  }
  if (gateway === 'razorpay' && mod && config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
    const rzp = new mod({ key_id: config.RAZORPAY_KEY_ID, key_secret: config.RAZORPAY_KEY_SECRET });
    const order = await rzp.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: orderId, payment_capture: 1 });
    return { intent_ref: order.id, amount, currency: 'INR' };
  }
  // Default: mock gateway intent for demo/dev mode.
  return { intent_ref: 'PI_' + crypto.randomBytes(8).toString('hex'), amount, currency: 'INR' };
}

function consumeCoupon(couponId, userId, orderId) {
  db.prepare('INSERT OR IGNORE INTO coupon_usage (coupon_id, user_id, order_id) VALUES (?, ?, ?)').run(couponId, userId, orderId);
  db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(couponId);
}

exports.initCheckout = (req, res, next) => {
  try {
    const { cart, items } = getCartSnapshot(req.userId);
    if (!items.length) throw new AppError('Your cart is empty.', 400);
    const coupon = cart.coupon_id ? db.prepare('SELECT * FROM coupons WHERE id = ?').get(cart.coupon_id) : null;
    const totals = computeTotals(items, coupon);
    res.json({
      success: true,
      data: {
        items: items.map((i) => ({
          product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity,
          name: i.name, image: i.image, variant_name: i.variant_name, line_price: i.line_price, total: i.line_price * i.quantity,
        })),
        coupon: coupon && new Date(coupon.expiry_date) > new Date() ? { code: coupon.code, type: coupon.type, value: coupon.value } : null,
        ...totals,
        free_delivery_threshold: FREE_DELIVERY_THRESHOLD,
        tax_rate: TAX_RATE,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.placeOrder = async (req, res, next) => {
  try {
    const { address_id, payment_method, payment_gateway = 'shopx-pay', remarks, use_payment_gateway = false } = req.body;

    const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(address_id, req.userId);
    if (!address) throw new AppError('Please select a valid delivery address.', 400);
    if (!['upi', 'card', 'netbanking', 'cod', 'wallet'].includes(payment_method)) {
      throw new AppError('Invalid payment method.', 400);
    }

    const { cart, items } = getCartSnapshot(req.userId);
    if (!items.length) throw new AppError('Your cart is empty.', 400);

    // Validate stock availability
    for (const item of items) {
      const stock = item.variant_stock !== null && item.variant_stock !== undefined ? item.variant_stock : item.stock;
      if (item.quantity > stock) {
        throw new AppError(`Not enough stock for "${item.name}". Please update quantity.`, 400);
      }
    }

    const coupon = cart.coupon_id ? db.prepare('SELECT * FROM coupons WHERE id = ?').get(cart.coupon_id) : null;
    if (coupon) {
      if (!coupon.is_active || new Date(coupon.expiry_date) < new Date()) throw new AppError('Applied coupon is no longer valid.', 400);
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw new AppError('Applied coupon has reached its usage limit.', 400);
    }

    const totals = computeTotals(items, coupon);
    const orderNumber = genOrderNumber();
    const isCOD = payment_method === 'cod';

    const eta = new Date();
    eta.setDate(eta.getDate() + 4);

    const addressSnapshot = JSON.stringify({
      full_name: address.full_name, phone: address.phone, email: address.email, house: address.house,
      city: address.city, state: address.state, pin_code: address.pin_code, country: address.country,
    });

    const ores = db.prepare(`INSERT INTO orders
      (order_number, user_id, address_id, address_snapshot, coupon_id, status, payment_method, payment_status,
       payment_gateway, subtotal, discount, delivery_fee, tax, total, coupon_code, tracking_stage, estimated_delivery, remarks)
      VALUES (?, ?, ?, ?, ?, 'ordered', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ordered', ?, ?)`)
      .run(
        orderNumber, req.userId, address.id, addressSnapshot, coupon?.id ?? null,
        payment_method, isCOD ? 'cod' : 'processing',
        payment_gateway, totals.subtotal, totals.discount, totals.deliveryFee, totals.tax, totals.total,
        coupon?.code ?? null, eta.toISOString(), remarks ?? null
      );
    const orderId = Number(ores.lastInsertRowid);

    const insertItem = db.prepare(`INSERT INTO order_items
      (order_id, product_id, variant_id, product_name, image, variant_name, quantity, price, discount, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const item of items) {
      const prod = db.prepare('SELECT price, compare_at_price, discount_percent FROM products WHERE id = ?').get(item.product_id);
      insertItem.run(orderId, item.product_id, item.variant_id, item.name, item.image, item.variant_name,
        item.quantity, item.line_price, item.compare_at_price ? item.compare_at_price - item.line_price : 0, item.line_price * item.quantity);
      // decrement stock
      db.prepare('UPDATE products SET stock = MAX(0, stock - ?), sold_count = sold_count + ? WHERE id = ?').run(item.quantity, item.quantity, item.product_id);
      if (item.variant_id) {
        db.prepare('UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?').run(item.quantity, item.variant_id);
      }
      // inventory log
      db.prepare('INSERT INTO inventory (product_id, variant_id, quantity_change, reason, new_stock, created_by) VALUES (?, ?, ?, ?, ?, ?)')
        .run(item.product_id, item.variant_id ?? null, -item.quantity, 'order_purchase', db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id).stock, req.userId);
    }

    let paymentResponse = null;
    if (isCOD) {
      db.prepare(`INSERT INTO payments (order_id, user_id, gateway, amount, status, method, details)
        VALUES (?, ?, 'cod', ?, 'cod', 'cod', ?)`).run(orderId, req.userId, totals.total, JSON.stringify({ type: 'cash_on_delivery' }));
      db.prepare(`UPDATE orders SET payment_status = 'cod' WHERE id = ?`).run(orderId);
    } else if (use_payment_gateway && payment_gateway !== 'shopx-pay') {
      const intent = await createPaymentIntent(payment_gateway, orderNumber, totals.total, payment_method);
      paymentResponse = intent;
      db.prepare(`INSERT INTO payments (order_id, user_id, gateway, amount, status, method, provider_ref, details)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`).run(orderId, req.userId, payment_gateway, totals.total, payment_method, intent.intent_ref, JSON.stringify({}));
    } else {
      // Simulated gateway confirmation for demo mode
      const mockRef = 'PMT_' + crypto.randomBytes(10).toString('hex');
      db.prepare(`INSERT INTO payments (order_id, user_id, gateway, amount, status, method, provider_ref, details)
        VALUES (?, ?, ?, ?, 'paid', ?, ?, ?)`).run(orderId, req.userId, payment_gateway, totals.total, payment_method, mockRef, JSON.stringify({ simulated: true }));
      db.prepare(`UPDATE orders SET payment_status = 'paid', payment_ref = ? WHERE id = ?`).run(mockRef, orderId);
      // Fake product review eligibility for demo orders
    }

    if (coupon) {
      consumeCoupon(coupon.id, req.userId, orderId);
    }

    // clear cart
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
    db.prepare('UPDATE cart SET coupon_id = NULL WHERE id = ?').run(cart.id);

    const user = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(req.userId);
    await sendMail({
      to: user.email,
      subject: `Order ${orderNumber} confirmed — Thanks for shopping at ShopX!`,
      text: `Hi ${user.full_name}, your order ${orderNumber} of Rs ${totals.total} has been placed successfully.`,
    });

    res.status(201).json({
      success: true,
      message: isCOD || !use_payment_gateway ? 'Order placed successfully.' : 'Order created. Complete payment to confirm.',
      data: { order_id: orderId, order_number: orderNumber, total: totals.total, payment: paymentResponse },
    });
  } catch (err) {
    next(err);
  }
};

// Webhook to confirm payment from a real gateway (e.g. Razorpay order.paid)
exports.onPaymentWebhook = (req, res, next) => {
  try {
    // Verify webhook signature in production!
    const { order_id, payment_status, provider_ref } = req.body;
    if (payment_status === 'paid') {
      db.prepare(`UPDATE orders SET payment_status = 'paid', payment_ref = ? WHERE id = ?`).run(provider_ref, order_id);
      db.prepare(`UPDATE payments SET status = 'paid', provider_ref = ? WHERE order_id = ?`).run(provider_ref, order_id);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};