const db = require('../db/connection');
const AppError = require('../utils/AppError');
const { paginate } = require('../utils/helpers');

const ORDER_STATUS_FLOW = ['ordered', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

exports.getMyOrders = (req, res, next) => {
  try {
    const { page = 1, perPage = 10, status } = req.query;
    const { page: pg, perPage: pp, offset } = paginate({ page, perPage });

    let where = 'WHERE user_id = ?';
    const params = [req.userId];
    if (status) { where += ' AND status = ?'; params.push(status); }

    const count = db.prepare(`SELECT COUNT(*) AS c FROM orders ${where}`).get(...params).c;
    const rows = db.prepare(
      `SELECT id, order_number, status, payment_method, payment_status, subtotal, discount, delivery_fee, tax, total,
              tracking_stage, estimated_delivery, created_at, updated_at
       FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pp, offset);

    const orderIds = rows.map((r) => r.id);
    const itemsByOrder = {};
    if (orderIds.length) {
      const items = db.prepare(
        `SELECT oi.order_id, oi.product_id, oi.product_name, oi.image, oi.variant_name, oi.quantity, oi.price, oi.total
         FROM order_items oi WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')}) ORDER BY oi.id`
      ).all(...orderIds);
      for (const it of items) {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push(it);
      }
    }

    const data = rows.map((r) => ({ ...r, items: itemsByOrder[r.id] || [] }));
    res.json({ success: true, data, pagination: { page: pg, perPage: pp, total: count.c, totalPages: Math.ceil(count.c / pp) } });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) throw new AppError('Order not found.', 404);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const payments = db.prepare('SELECT id, gateway, amount, status, method, provider_ref, created_at FROM payments WHERE order_id = ?').all(order.id);
    const address = order.address_snapshot ? JSON.parse(order.address_snapshot) : null;
    res.json({ success: true, data: { ...order, items, payments, address } });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) throw new AppError('Order not found.', 404);
    if (['delivered', 'cancelled', 'returned', 'refunded'].includes(order.status)) {
      throw new AppError(`Order cannot be cancelled (status: ${order.status.replace(/_/g, ' ')}).`, 400);
    }
    if (order.payment_status === 'refunded') throw new AppError('Order already refunded.', 400);

    db.prepare(`UPDATE orders SET status = 'cancelled', cancellation_reason = ?, tracking_stage = 'cancelled', updated_at = datetime('now') WHERE id = ?`)
      .run(reason || null, order.id);

    // restore stock
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    for (const it of items) {
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(it.quantity, it.product_id);
      if (it.variant_id) {
        db.prepare('UPDATE product_variants SET stock = stock + ? WHERE id = ?').run(it.quantity, it.variant_id);
      }
    }

    // refund if paid
    if (order.payment_status === 'paid' || order.payment_status === 'cod') {
      db.prepare(`UPDATE orders SET payment_status = 'refunded' WHERE id = ?`).run(order.id);
      db.prepare(`UPDATE payments SET status = 'refunded' WHERE order_id = ?`).run(order.id);
    }
    db.prepare(`INSERT INTO notifications (user_id, type, title, body, meta)
      VALUES (?, ?, ?, ?, ?)`).run(req.userId, 'order', 'Order cancelled',
      `Your order ${order.order_number} has been cancelled.` + (order.payment_status === 'paid' ? ' Refund will be processed within 5-7 business days.' : ''), JSON.stringify({ order_id: order.id }));

    res.json({ success: true, message: 'Order cancelled successfully.', data: db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id) });
  } catch (err) {
    next(err);
  }
};

exports.requestReturn = (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) throw new AppError('Order not found.', 404);
    if (order.status !== 'delivered') throw new AppError('Only delivered orders can be returned.', 400);

    db.prepare(`UPDATE orders SET status = 'return_requested', tracking_stage = 'return_requested', updated_at = datetime('now') WHERE id = ?`).run(order.id);
    db.prepare(`INSERT INTO notifications (user_id, type, title, body, meta)
      VALUES (?, ?, ?, ?, ?)`).run(req.userId, 'order', 'Return requested',
      `Return requested for order ${order.order_number}.`, JSON.stringify({ order_id: order.id, reason }));
    res.json({ success: true, message: 'Return request submitted. We will review it shortly.' });
  } catch (err) {
    next(err);
  }
};

exports.getTracking = (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) throw new AppError('Order not found.', 404);
    const flow = ORDER_STATUS_FLOW;
    let stageIndex = flow.indexOf(order.tracking_stage === 'cancelled' || order.tracking_stage === 'return_requested' ? order.tracking_stage : order.tracking_stage);
    if (stageIndex === -1) stageIndex = order.status === 'delivered' ? flow.length - 1 : 0;

    const stages = flow.map((s, i) => ({
      key: s,
      label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      completed: i < stageIndex,
      active: i === stageIndex,
    }));
    res.json({
      success: true,
      data: {
        order_number: order.order_number, status: order.status, stages, estimated_delivery: order.estimated_delivery,
        cancelled: order.status === 'cancelled', return_requested: order.status === 'return_requested',
      },
    });
  } catch (err) {
    next(err);
  }
};

function buildInvoiceData(order) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const address = JSON.parse(order.address_snapshot || '{}');
  const user = db.prepare('SELECT full_name, email, phone FROM users WHERE id = ?').get(order.user_id);
  return {
    invoice_no: 'INV-' + order.order_number.slice(-10),
    order,
    items,
    address,
    user,
    totals: {
      subtotal: order.subtotal, discount: order.discount, delivery_fee: order.delivery_fee, tax: order.tax, total: order.total,
    },
  };
}

exports.getInvoice = (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) throw new AppError('Order not found.', 404);
    res.json({ success: true, data: buildInvoiceData(order) });
  } catch (err) {
    next(err);
  }
};