const db = require('../../db/connection');

exports.getDashboard = (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const stats = {
      total_revenue: db.prepare(`SELECT IFNULL(SUM(total),0) AS v FROM orders WHERE status NOT IN ('cancelled','refunded')`).get().v,
      today_revenue: db.prepare(`SELECT IFNULL(SUM(total),0) AS v FROM orders WHERE date(created_at) = ? AND status NOT IN ('cancelled','refunded')`).get(today).v,
      total_orders: db.prepare('SELECT COUNT(*) AS v FROM orders').get().v,
      pending_orders: db.prepare(`SELECT COUNT(*) AS v FROM orders WHERE status IN ('ordered','confirmed','packed')`).get().v,
      total_customers: db.prepare(`SELECT COUNT(*) AS v FROM users WHERE role = 'customer'`).get().v,
      new_customers_7d: db.prepare(`SELECT COUNT(*) AS v FROM users WHERE role = 'customer' AND date(created_at) >= date('now','-7 days')`).get().v,
      total_products: db.prepare('SELECT COUNT(*) AS v FROM products').get().v,
      low_stock_products: db.prepare('SELECT COUNT(*) AS v FROM products WHERE stock <= low_stock_threshold AND stock > 0').get().v,
      out_of_stock_products: db.prepare('SELECT COUNT(*) AS v FROM products WHERE stock <= 0').get().v,
    };

    // 7-day sales chart
    const salesChart = [];
    const ordersChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = db.prepare(`SELECT IFNULL(SUM(total),0) AS s, COUNT(*) AS o FROM orders WHERE date(created_at) = ? AND status NOT IN ('cancelled','refunded')`).get(key);
      salesChart.push({ date: key, revenue: row.s });
      ordersChart.push({ date: key, orders: row.o });
    }

    // 12-month sales
    const monthRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const row = db.prepare(`SELECT IFNULL(SUM(total),0) AS s FROM orders WHERE substr(created_at,1,7) = ? AND status NOT IN ('cancelled','refunded')`).get(key);
      monthRevenue.push({ month: key, revenue: row.s });
    }

    const topProducts = db.prepare(
      `SELECT p.id, p.name, p.price, p.sold_count, p.rating_avg, p.stock,
         (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image,
         p.sold_count * p.price AS revenue
       FROM products p ORDER BY p.sold_count DESC LIMIT 6`
    ).all();

    const recentOrders = db.prepare(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at, u.full_name AS customer,
         CASE WHEN o.payment_status IN ('paid','cod') THEN 'paid' ELSE o.payment_status END AS payment_status
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 8`
    ).all();

    const trendPct = (cur, prev) => {
      if (!prev) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 100);
    };
    const last7 = [...salesChart].slice(0, 6).reduce((a, b) => a + b.revenue, 0);
    const cur7 = salesChart.reduce((a, b) => a + b.revenue, 0);

    res.json({
      success: true,
      data: {
        stats,
        sales_chart: salesChart,
        orders_chart: ordersChart,
        month_revenue: monthRevenue,
        top_products: topProducts,
        recent_orders: recentOrders,
        revenue_change: trendPct(cur7, last7),
        orders_change: trendPct(
          ordersChart.reduce((a, b) => a + b.orders, 0),
          ordersChart.slice(0, 6).reduce((a, b) => a + b.orders, 0)
        ),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = (req, res, next) => {
  try {
    const { range = 'week' } = req.query;
    let start = 'date(\'now\',\'-1 day\')';
    if (range === 'week') start = 'date(\'now\',\'-7 days\')';
    if (range === 'month') start = 'date(\'now\',\'-30 days\')';
    if (range === 'year') start = 'date(\'now\',\'-12 months\')';

    const revenue = db.prepare(`SELECT IFNULL(SUM(total),0) AS s FROM orders WHERE date(created_at) >= ${start} AND status NOT IN ('cancelled','refunded')`).get().s;
    const orders = db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE date(created_at) >= ${start}`).get().c;
    const customers = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'customer' AND date(created_at) >= ${start}`).get().c;
    const avgOrderValue = orders ? Math.round(revenue / orders) : 0;

    const categoryPerformance = db.prepare(
      `SELECT c.name, c.id, COUNT(DISTINCT oi.id) AS items_sold, IFNULL(SUM(oi.total),0) AS revenue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.category_id
       JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled','refunded')
       WHERE date(o.created_at) >= ${start}
       GROUP BY c.id, c.name ORDER BY revenue DESC LIMIT 8`
    ).all();

    const productPerformance = db.prepare(
      `SELECT p.id, p.name, p.price, p.sold_count, SUM(oi.quantity) AS sold_in_range, IFNULL(SUM(oi.total),0) AS revenue,
         (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled','refunded') AND date(o.created_at) >= ${start}
       GROUP BY p.id ORDER BY sold_in_range DESC LIMIT 8`
    ).all();

    const customerGrowth = db.prepare(
      `SELECT date(created_at) AS d, COUNT(*) AS c FROM users WHERE role = 'customer' AND date(created_at) >= ${start}
       GROUP BY date(created_at) ORDER BY d`
    ).all();

    res.json({
      success: true,
      data: {
        range,
        revenue, orders, customers, avg_order_value: avgOrderValue,
        category_performance: categoryPerformance,
        product_performance: productPerformance,
        customer_growth: customerGrowth,
        conversion_rate: customers ? Math.round((orders / Math.max(1, customers)) * 100) / 100 : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};