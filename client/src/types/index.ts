export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'admin';
  avatar: string | null;
  email_verified: number;
  is_blocked?: number;
  created_at: string;
}

export interface ProductImage {
  url: string;
  alt?: string | null;
  sort_order?: number;
}

export interface Variant {
  id: number;
  product_id?: number;
  sku?: string;
  name?: string;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  stock: number;
  image?: string | null;
  is_active?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  sku?: string;
  brand_id: number | null;
  brand_name?: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  price: number;
  compare_at_price: number | null;
  discount_percent: number;
  stock: number;
  is_published: number;
  is_featured: number;
  is_trending: number;
  is_best_seller: number;
  is_new: number;
  rating_avg: number;
  rating_count: number;
  reviews_count: number;
  sold_count: number;
  tags?: string | null;
  specifications?: Record<string, string> | null;
  image?: string | null;
  images?: ProductImage[];
  variants?: Variant[];
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  product_count?: number;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  product_count?: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  saved_for_later: number;
  line_price: number;
  name: string;
  slug: string;
  product_price: number;
  compare_at_price: number | null;
  discount_percent: number;
  stock: number;
  image: string | null;
  variant_name?: string;
  color?: string | null;
  size?: string | null;
}

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  expiry_date?: string | null;
  usage_limit?: number;
  used_count?: number;
  is_active?: number;
}

export interface CartData {
  id: number;
  items: CartItem[];
  saved_items: CartItem[];
  item_count: number;
  subtotal: number;
  coupon_discount: number;
  coupon: Pick<Coupon, 'id' | 'code' | 'type' | 'value'> | null;
  delivery_fee: number;
  tax: number;
  total: number;
}

export interface Address {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  email?: string | null;
  house: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  is_default: number;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  created_at: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  discount_percent: number;
  stock: number;
  rating_avg: number;
  rating_count: number;
  image: string | null;
  variant_name?: string;
}

export interface OrderItem {
  id: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  image?: string | null;
  variant_name?: string | null;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total: number;
  coupon_code?: string | null;
  tracking_stage: string;
  estimated_delivery?: string | null;
  cancellation_reason?: string | null;
  remarks?: string | null;
  created_at: string;
  items?: OrderItem[];
  address?: Address | null;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  order_item_id?: number | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  images?: string | null;
  is_verified: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  full_name?: string;
  avatar?: string | null;
}

export interface HomeData {
  banners: Banner[];
  categories: Category[];
  trending: Product[];
  best_sellers: Product[];
  new_arrivals: Product[];
  featured: Product[];
}

export interface Banner {
  title: string;
  subtitle: string;
  tagline: string;
  image: string;
  cta: string;
  link: string;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: Pagination;
}

export interface CheckoutInit {
  items: Array<{
    product_id: number;
    variant_id: number | null;
    quantity: number;
    name: string;
    image: string | null;
    variant_name?: string;
    line_price: number;
    total: number;
  }>;
  coupon: Pick<Coupon, 'code' | 'type' | 'value'> | null;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  free_delivery_threshold: number;
  tax_rate: number;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  is_read: number;
  meta?: string | null;
  created_at: string;
}

export interface DashboardData {
  stats: {
    total_revenue: number;
    today_revenue: number;
    total_orders: number;
    pending_orders: number;
    total_customers: number;
    new_customers_7d: number;
    total_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
  };
  sales_chart: Array<{ date: string; revenue: number }>;
  orders_chart: Array<{ date: string; orders: number }>;
  month_revenue: Array<{ month: string; revenue: number }>;
  top_products: Array<Record<string, unknown>>;
  recent_orders: Array<Record<string, unknown>>;
  revenue_change: number;
  orders_change: number;
}

export interface AnalyticsData {
  range: string;
  revenue: number;
  orders: number;
  customers: number;
  avg_order_value: number;
  conversion_rate: number;
  category_performance: Array<Record<string, unknown>>;
  product_performance: Array<Record<string, unknown>>;
  customer_growth: Array<{ d: string; c: number }>;
}