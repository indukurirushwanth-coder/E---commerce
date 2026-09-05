const db = require('../db/connection');
const AppError = require('../utils/AppError');
const { paginate, slugify } = require('../utils/helpers');

const PRODUCT_SELECT = `
  p.id, p.name, p.slug, p.description, p.sku, p.brand_id, p.category_id, p.price, p.compare_at_price,
  p.discount_percent, p.stock, p.is_published, p.is_featured, p.is_trending, p.is_best_seller, p.is_new,
  p.rating_avg, p.rating_count, p.reviews_count, p.view_count, p.sold_count, p.tags, p.specifications, p.created_at,
  b.name AS brand_name,
  c.name AS category_name, c.slug AS category_slug
`;

function getImagesForProducts(ids) {
  const images = {};
  if (!ids.length) return images;
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT pi.product_id, pi.url, pi.alt FROM product_images pi
     WHERE pi.product_id IN (${placeholders}) ORDER BY pi.sort_order`
  ).all(...ids);
  for (const row of rows) {
    if (!images[row.product_id]) images[row.product_id] = [];
    images[row.product_id].push({ url: row.url, alt: row.alt });
  }
  return images;
}

exports.getProducts = (req, res, next) => {
  try {
    const {
      q, category, brand, min_price, max_price, rating, discount, availability,
      sort = 'featured', page = 1, perPage = 20, include_children = '1',
    } = req.query;

    const where = [];
    const params = [];

    if (q) {
      where.push(`(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ? OR p.tags LIKE ? OR p.sku LIKE ?)`);
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }

    let catIds = [];
    if (category) {
      const includeKids = include_children !== '0';
      if (includeKids) {
        catIds = db.prepare(
          'SELECT id FROM categories WHERE slug = ? OR parent_id = (SELECT id FROM categories WHERE slug = ?)'
        ).all(category, category).map((r) => r.id);
      } else {
        catIds = db.prepare('SELECT id FROM categories WHERE slug = ?').all(category).map((r) => r.id);
      }
      if (!catIds.length) catIds = [-1];
      where.push(`p.category_id IN (${catIds.map(() => '?').join(',')})`);
      params.push(...catIds);
    }

    if (brand) {
      const brands = brand.split(',').filter(Boolean);
      where.push(`b.slug IN (${brands.map(() => '?').join(',')})`);
      params.push(...brands);
    }

    if (min_price !== undefined && min_price !== '') {
      where.push(`p.price >= ?`);
      params.push(Number(min_price));
    }
    if (max_price !== undefined && max_price !== '') {
      where.push(`p.price <= ?`);
      params.push(Number(max_price));
    }

    if (rating && Number(rating) > 0) {
      where.push(`p.rating_avg >= ?`);
      params.push(Number(rating));
    }

    if (discount && Number(discount) > 0) {
      where.push(`p.discount_percent >= ?`);
      params.push(Number(discount));
    }

    if (availability) {
      if (availability === 'in_stock' || availability === 'available') {
        where.push(`p.stock > 0`);
      } else if (availability === 'out_of_stock') {
        where.push(`p.stock <= 0`);
      }
    }

    where.push(`p.is_published = 1`);

    const sortMap = {
      featured: 'p.is_featured DESC, p.sold_count DESC',
      newest: 'p.created_at DESC',
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      rating: 'p.rating_avg DESC',
      popular: 'p.sold_count DESC, p.view_count DESC',
      name_asc: 'p.name ASC',
    };
    const orderBy = sortMap[sort] || sortMap.featured;

    const { page: pg, perPage: pp, offset } = paginate({ page, perPage });
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRow = db.prepare(
      `SELECT COUNT(*) AS c FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`
    ).get(...params);

    const rows = db.prepare(
      `SELECT ${PRODUCT_SELECT} FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    ).all(...params, pp, offset);

    const ids = rows.map((r) => r.id);
    const images = getImagesForProducts(ids);

    const products = rows.map((r) => ({
      ...r,
      images: images[r.id] || [],
      image: (images[r.id] && images[r.id][0]?.url) || null,
      specifications: r.specifications ? JSON.parse(r.specifications) : null,
    }));

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pg, perPage: pp, total: countRow.c, totalPages: Math.ceil(countRow.c / pp),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProductBySlug = (req, res, next) => {
  try {
    const row = db.prepare(
      `SELECT ${PRODUCT_SELECT} FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ?`
    ).get(req.params.slug);

    if (!row || !row.is_published) throw new AppError('Product not found.', 404);

    // increment view count
    db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').run(row.id);

    const images = db.prepare('SELECT url, alt, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order').all(row.id);
    const variants = db.prepare('SELECT id, sku, name, color, size, price, compare_at_price, stock, image FROM product_variants WHERE product_id = ? AND is_active = 1').all(row.id);

    const related = db.prepare(
      `SELECT ${PRODUCT_SELECT} FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = ? AND p.id != ? AND p.is_published = 1
       ORDER BY p.sold_count DESC LIMIT 8`
    ).all(row.category_id, row.id);
    const relatedImages = getImagesForProducts(related.map((r) => r.id));

    const reviews = db.prepare(
      `SELECT r.*, u.full_name, u.avatar FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.status = 1
       ORDER BY r.created_at DESC LIMIT 5`
    ).all(row.id);

    const freqBought = db.prepare(
      `SELECT DISTINCT p2t.id, p2t.name, p2t.slug, p2t.price, p2t.compare_at_price, p2t.discount_percent, p2t.rating_avg, p2t.reviews_count, p2t.sold_count
       FROM order_items oi1
       JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id
       JOIN products p2t ON p2t.id = oi2.product_id AND p2t.is_published = 1
       WHERE oi1.product_id = ?
       ORDER BY COUNT(*) DESC LIMIT 4`
    ).all(row.id);
    const fIds = freqBought.map((r) => r.id);
    const fImages = getImagesForProducts(fIds);
    const frequentlyBought = freqBought.map((r) => ({ ...r, image: (fImages[r.id] && fImages[r.id][0]?.url) || null }));

    const product = {
      ...row,
      images,
      variants,
      reviews,
      frequently_bought_together: frequentlyBought,
      related: related.map((r) => ({
        ...r,
        image: (relatedImages[r.id] && relatedImages[r.id][0]?.url) || null,
        specifications: r.specifications ? null : null,
      })),
      specifications: row.specifications ? JSON.parse(row.specifications) : null,
    };

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = (req, res, next) => {
  try {
    const cats = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all();
    const tree = [];
    for (const cat of cats) {
      if (!cat.parent_id) {
        tree.push({ ...cat, children: cats.filter((c) => c.parent_id === cat.id) });
      }
    }
    res.json({ success: true, data: tree });
  } catch (err) {
    next(err);
  }
};

exports.getBrands = (req, res, next) => {
  try {
    const rows = db.prepare(
      `SELECT b.id, b.name, b.slug, COUNT(p.id) as product_count
       FROM brands b LEFT JOIN products p ON p.brand_id = b.id AND p.is_published = 1
       GROUP BY b.id HAVING product_count > 0 ORDER BY product_count DESC`
    ).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getHomeData = (req, res, next) => {
  try {
    const pickRows = (clause, limit = 12) => {
      const rows = db.prepare(
        `SELECT ${PRODUCT_SELECT} FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.is_published = 1 ${clause} ORDER BY p.sold_count DESC LIMIT ?`
      ).all(limit);
      const ids = rows.map((r) => r.id);
      const images = getImagesForProducts(ids);
      return rows.map((r) => ({ ...r, image: (images[r.id] && images[r.id][0]?.url) || null }));
    };

    const categories = db.prepare(
      `SELECT c.id, c.name, c.slug, c.image, c.description,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id OR p.category_id IN (SELECT id FROM categories WHERE parent_id = c.id)) as product_count
       FROM categories c WHERE c.is_active = 1 AND c.parent_id IS NULL ORDER BY c.sort_order LIMIT 8`
    ).all();

    const banners = [
      {
        title: 'Mega Eid Sale',
        subtitle: 'Up to 50% off on everything you love',
        tagline: 'Limited time offer',
        image: IMG_BANNER_1,
        cta: 'Shop Now',
        link: '/products?discount=30',
      },
      {
        title: 'New Season Fashion',
        subtitle: 'Trending styles for the new you',
        tagline: 'New arrivals daily',
        image: IMG_BANNER_2,
        cta: 'Explore Fashion',
        link: '/products?category=fashion',
      },
      {
        title: 'Gadget Week',
        subtitle: 'Latest electronics at unbeatable prices',
        tagline: 'Tech that moves you',
        image: IMG_BANNER_3,
        cta: 'Shop Electronics',
        link: '/products?category=electronics',
      },
    ];

    res.json({
      success: true,
      data: {
        banners,
        categories,
        trending: pickRows('AND p.is_trending = 1'),
        best_sellers: pickRows('AND p.is_best_seller = 1'),
        new_arrivals: pickRows('AND p.is_new = 1'),
        featured: pickRows('AND p.is_featured = 1'),
      },
    });
  } catch (err) {
    next(err);
  }
};

const IMG_BANNER_1 = 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1400&q=80';
const IMG_BANNER_2 = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80';
const IMG_BANNER_3 = 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1400&q=80';