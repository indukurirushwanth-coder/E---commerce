const db = require('../../db/connection');
const AppError = require('../../utils/AppError');
const { paginate } = require('../../utils/helpers');

const ALLOWED_STATUSES = ['ordered', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'];

exports.listOrders = (req, res, next) => {
  try {
    const { page = 1, perPage = 15, status, q, from, to } = req.query;
    const { page: pg, perPage: pp, offset } = paginate({ page, perPage });
    const where = [];
    const params = [];
    if (status) { where.push('o.status = ?'); params.push(status); }
    if (q) {
      where.push('(o.order_number LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR o.payment_ref LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (from) { where.push('date(o.created_at) >= date(?)'); params.push(from); }
    if (to) { where.push('date(o.created_at) <= date(?)'); params.push(to); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const count = db.prepare(`SELECT COUNT(*) AS c FROM orders o JOIN users u ON u.id = o.user_id ${whereSql}`).get(...params).c;

    const rows = db.prepare(`
      SELECT o.id, o.order_number, o.status, o.payment_method, o.payment_status, o.total, o.created_at,
             o.estimated_delivery, o.coupon_code, u.full_name AS customer, u.email AS customer_email,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o JOIN users u ON u.id = o.user_id
      ${whereSql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pp, offset);

    res.json({ success: true, data: rows, pagination: { page: pg, perPage: pp, total: count.c, totalPages: Math.ceil(count.c / pp) } });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = (req, res, next) => {
  try {
    const order = db.prepare(`SELECT o.*, u.full_name, u.email as customer_email, u.phone as customer_phone FROM orders o
      JOIN users u ON u.id = o.user_id WHERE o.id = ?`).get(req.params.id);
    if (!order) throw new AppError('Order not found.', 404);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(order.id);
    const address = order.address_snapshot ? JSON.parse(order.address_snapshot) : null;
    res.json({ success: true, data: { ...order, items, payments, address } });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) throw new AppError('Order not found.', 404);
    const { status, auto_deliver = true } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) throw new AppError('Invalid status.', 400);

    const flow = ['ordered', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const previousIdx = flow.indexOf(order.tracking_stage);
    const newIdx = flow.indexOf(status);

    if (status === 'delivered') {
      db.prepare(`UPDATE orders SET status = 'delivered', tracking_stage = 'delivered', delivered_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(order.id);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      for (const it of items) {
        db.prepare('INSERT INTO notifications (user_id, type, title, body, meta) VALUES (?, ?, ?, ?, ?)')
          .run(order.user_id, 'order', 'Order delivered', `Your order ${order.order_number} has been delivered. Enjoy!`, JSON.stringify({ order_id: order.id }));
      }
    } else if (status === 'cancelled') {
      db.prepare(`UPDATE orders SET status = 'cancelled', tracking_stage = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(order.id);
      if (order.payment_status === 'paid') {
        db.prepare(`UPDATE orders SET payment_status = 'refunded' WHERE id = ?`).run(order.id);
        db.prepare(`UPDATE payments SET status = 'refunded' WHERE order_id = ?`).run(order.id);
      }
    } else if (status === 'returned' || status === 'refunded') {
      if (order.status === 'return_requested' || order.status === 'delivered') {
        db.prepare(`UPDATE orders SET status = ?, tracking_stage = 'returned', updated_at = datetime('now') WHERE id = ?`).run(status, order.id);
        if (status === 'refunded') {
          db.prepare(`UPDATE orders SET payment_status = 'refunded' WHERE id = ?`).run(order.id);
          db.prepare(`UPDATE payments SET status = 'refunded' WHERE order_id = ?`).run(order.id);
        }
      }
    } else {
      const stage = newIdx === -1 ? previousIdx + 1 : newIdx;
      const nextStage = flow[Math.min(stage, flow.length - 1)] || status;
      db.prepare(`UPDATE orders SET status = ?, tracking_stage = ?, updated_at = datetime('now') WHERE id = ?`).run(status, status === 'confirmed' ? 'confirmed' : nextStage, order.id);
      db.prepare(`INSERT INTO notifications (user_id, type, title, body, meta) VALUES (?, ?, ?, ?, ?)`)
        .run(order.user_id, 'order', `Order ${status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
          `Your order ${order.order_number} status changed to ${status.replace(/_/g, ' ')}.`,
          JSON.stringify({ order_id: order.id }));
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    res.json({ success: true, data: updated, message: 'Order status updated.' });
  } catch (err) {
    next(err);
  }
};

exports.getInvoice = (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) throw new AppError('Order not found.', 404);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const address = JSON.parse(order.address_snapshot || '{}');
    const customer = db.prepare('SELECT full_name, email, phone FROM users WHERE id = ?').get(order.user_id);
    res.json({
      success: true,
      data: {
        invoice_no: 'INV-' + order.order_number.slice(-10),
        order,
        items, address, customer,
        totals: { subtotal: order.subtotal, discount: order.discount, delivery_fee: order.delivery_fee, tax: order.tax, total: order.total },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.listCustomers = (req, res, next) => {
  try {
    const { q } = req.query;
    let where = 'WHERE u.role = \'customer\'';
    const params = [];
    if (q) {
      where += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    const rows = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.phone, u.email_verified, u.is_blocked, u.created_at,
             (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count,
             (SELECT IFNULL(SUM(o.total),0) FROM orders o WHERE o.user_id = u.id AND o.status NOT IN ('cancelled','refunded')) as total_spent
      FROM users u ${where} ORDER BY u.created_at DESC
    `).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getCustomer = (req, res, next) => {
  try {
    const user = db.prepare(`SELECT id, full_name, email, phone, email_verified, is_blocked, avatar, created_at FROM users WHERE id = ? AND role = 'customer'`).get(req.params.id);
    if (!user) throw new AppError('Customer not found.', 404);
    const orders = db.prepare('SELECT id, order_number, status, total, payment_status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ?').all(user.id);
    res.json({ success: true, data: { ...user, orders, addresses } });
  } catch (err) {
    next(err);
  }
};

exports.toggleBlock = (req, res, next) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND role = \'customer\'').get(req.params.id);
    if (!user) throw new AppError('Customer not found.', 404);
    const block = req.body.is_blocked ? 1 : 0;
    db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(block, user.id);
    res.json({ success: true, message: block ? 'Customer blocked.' : 'Customer unblocked.' });
  } catch (err) {
    next(err);
  }
};