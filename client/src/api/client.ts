import type { Address, AnalyticsData, Brand, Category, CheckoutInit, Coupon, DashboardData, HomeData, Notification, Order, Pagination, Product, ProductListResponse, Review, User } from '@/types'

const BASE = '/api'

const TOKEN_KEY = 'shopx_token'

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '',
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  setTokenSession: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  },
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = auth.getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  let body: any = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    if (res.status === 401 && retry && auth.getToken()) {
      auth.clearToken()
      window.dispatchEvent(new Event('shopx:logout'))
    }
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status)
  }
  return body as T
}

export const api = {
  // Auth
  register: (data: { full_name: string; email: string; phone?: string; password: string }) =>
    request<{ success: boolean; user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ success: boolean; user: User }>('/auth/me'),
  updateProfile: (data: Partial<Pick<User, 'full_name' | 'phone' | 'avatar'>>) =>
    request<{ success: boolean; user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: { old_password: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, new_password: string) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
  verifyEmail: (token: string) =>
    request<{ success: boolean; message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  // Products
  getHome: () => request<{ success: boolean; data: HomeData }>('/products/home'),
  getProducts: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v))
    })
    return request<ProductListResponse>(`/products?${qs.toString()}`)
  },
  getProduct: (slug: string) => request<{ success: boolean; data: Product }>(`/products/${slug}`),
  getCategories: () => request<{ success: boolean; data: Category[] }>('/products/categories'),
  getBrands: () => request<{ success: boolean; data: Brand[] }>('/products/brands'),

  // Search
  searchSuggest: (q: string) => request<{ success: boolean; data: { products: Product[]; categories: Array<{ name: string; slug: string }>; brands: Array<{ name: string; slug: string }> } }>(`/search/suggest?q=${encodeURIComponent(q)}`),
  recentSearches: () => request<{ success: boolean; data: Array<{ query: string; last_seen: string }> }>('/search/recent'),
  clearSearchHistory: () => request<{ success: boolean }>('/search/history', { method: 'DELETE' }),

  // Cart
  getCart: () => request<{ success: boolean; data: import('@/types').CartData }>('/cart'),
  addToCart: (data: { product_id: number; variant_id?: number | null; quantity?: number }) =>
    request<{ success: boolean; data: import('@/types').CartData; message: string }>('/cart/items', { method: 'POST', body: JSON.stringify(data) }),
  updateCartItem: (id: number, quantity: number) =>
    request<{ success: boolean; data: import('@/types').CartData }>(`/cart/items/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (id: number) =>
    request<{ success: boolean; data: import('@/types').CartData }>(`/cart/items/${id}`, { method: 'DELETE' }),
  saveForLater: (id: number) =>
    request<{ success: boolean; data: import('@/types').CartData }>(`/cart/items/${id}/save`, { method: 'POST' }),
  clearCart: () => request<{ success: boolean; data: import('@/types').CartData }>('/cart', { method: 'DELETE' }),
  applyCoupon: (code: string) =>
    request<{ success: boolean; data: import('@/types').CartData; message: string }>('/cart/coupon', { method: 'POST', body: JSON.stringify({ code }) }),
  removeCoupon: () => request<{ success: boolean; data: import('@/types').CartData }>('/cart/coupon', { method: 'DELETE' }),
  validatePin: (pincode: string) =>
    request<{ success: boolean; available: boolean; eta_days?: number; cod_available?: boolean; estimated_delivery?: string; message?: string }>('/cart/validate-pin', { method: 'POST', body: JSON.stringify({ pincode }) }),

  // Wishlist
  getWishlist: () => request<{ success: boolean; data: { items: import('@/types').WishlistItem[]; count: number } }>('/wishlist'),
  addToWishlist: (product_id: number, variant_id?: number | null) =>
    request<{ success: boolean; data: { count: number }; message: string }>('/wishlist/items', { method: 'POST', body: JSON.stringify({ product_id, variant_id }) }),
  removeFromWishlist: (product_id: number) =>
    request<{ success: boolean; data: { count: number } }>(`/wishlist/items/${product_id}`, { method: 'DELETE' }),
  moveWishlistToCart: (product_id: number) =>
    request<{ success: boolean; data: { count: number }; message: string }>('/wishlist/move-to-cart', { method: 'POST', body: JSON.stringify({ product_id }) }),

  // Addresses
  getAddresses: () => request<{ success: boolean; data: Address[] }>('/addresses'),
  createAddress: (data: Omit<Address, 'id' | 'user_id'>) =>
    request<{ success: boolean; data: Address }>('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  updateAddress: (id: number, data: Partial<Address>) =>
    request<{ success: boolean; data: Address }>(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAddress: (id: number) => request<{ success: boolean }>(`/addresses/${id}`, { method: 'DELETE' }),

  // Checkout
  initCheckout: () => request<{ success: boolean; data: CheckoutInit }>('/checkout/init', { method: 'POST' }),
  placeOrder: (data: { address_id: number; payment_method: string; payment_gateway?: string; use_payment_gateway?: boolean; remarks?: string }) =>
    request<{ success: boolean; message: string; data: { order_id: number; order_number: string; total: number; payment?: { intent_ref?: string; amount?: number; currency?: string } | null } }>('/checkout/place', { method: 'POST', body: JSON.stringify(data) }),

  // Orders
  getOrders: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
    return request<{ success: boolean; data: Order[]; pagination: Pagination }>(`/orders?${qs.toString()}`)
  },
  getOrder: (id: number) => request<{ success: boolean; data: Order }>(`/orders/${id}`),
  getOrderTracking: (id: number) => request<{ success: boolean; data: { order_number: string; status: string; stages: Array<{ key: string; label: string; completed: boolean; active: boolean }>; estimated_delivery?: string | null; cancelled: boolean; return_requested: boolean } }>(`/orders/tracking/${id}`),
  getOrderInvoice: (id: number) => request<{ success: boolean; data: Record<string, unknown> }>(`/orders/invoice/${id}`),
  cancelOrder: (id: number, reason?: string) =>
    request<{ success: boolean; message: string }>(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  requestReturn: (id: number, reason?: string) =>
    request<{ success: boolean; message: string }>(`/orders/${id}/return`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Reviews
  getProductReviews: (productId: number) => request<{ success: boolean; data: Review[] }>(`/reviews/product/${productId}`),
  canReview: (productId: number) => request<{ success: boolean; data: { can_review: boolean; order_item_id?: number | null } }>(`/reviews/product/${productId}/can-review`),
  createReview: (data: { product_id: number; rating: number; title?: string; body?: string; order_item_id?: number | null }) =>
    request<{ success: boolean; data: Review; message: string }>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  markReviewHelpful: (id: number, helpful: boolean) =>
    request<{ success: boolean; data: { helpful_count: number; not_helpful_count: number }; message: string }>(`/reviews/${id}/helpful`, { method: 'POST', body: JSON.stringify({ helpful }) }),

  // Coupons (customer)
  getAvailableCoupons: () => request<{ success: boolean; data: Coupon[] }>('/coupons/available'),

  // Notifications
  getNotifications: () => request<{ success: boolean; data: Notification[] }>('/notifications'),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),
  markNotificationRead: (id: number) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  deleteNotification: (id: number) => request<{ success: boolean }>(`/notifications/${id}`, { method: 'DELETE' }),

  // Newsletter
  subscribeNewsletter: (email: string) =>
    request<{ success: boolean; message: string }>('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),

  // Admin
  admin: {
    dashboard: () => request<{ success: boolean; data: DashboardData }>('/admin/analytics/dashboard'),
    analytics: (range: string) => request<{ success: boolean; data: AnalyticsData }>(`/admin/analytics?range=${range}`),
    products: () => request<{ success: boolean; data: Product[] }>('/admin/products'),
    product: (id: number) => request<{ success: boolean; data: Product & { images: Array<Record<string, unknown>>; variants: Array<Record<string, unknown>> } }>(`/admin/products/${id}`),
    createProduct: (data: Record<string, unknown>) => request<{ success: boolean; data: { id: number }; message: string }>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id: number, data: Record<string, unknown>) => request<{ success: boolean; message: string }>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id: number) => request<{ success: boolean; message: string }>(`/admin/products/${id}`, { method: 'DELETE' }),
    togglePublish: (id: number, is_published: boolean) => request<{ success: boolean; message: string }>(`/admin/products/${id}/publish`, { method: 'POST', body: JSON.stringify({ is_published }) }),
    categories: () => request<{ success: boolean; data: Category[] }>('/admin/categories'),
    createCategory: (data: Record<string, unknown>) => request<{ success: boolean; data: { id: number }; message: string }>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id: number, data: Record<string, unknown>) => request<{ success: boolean; message: string }>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id: number) => request<{ success: boolean; message: string }>(`/admin/categories/${id}`, { method: 'DELETE' }),
    orders: (params: Record<string, string | number | undefined> = {}) => {
      const qs = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
      return request<{ success: boolean; data: Array<Record<string, unknown>>; pagination: Pagination }>(`/admin/orders?${qs.toString()}`)
    },
    order: (id: number) => request<{ success: boolean; data: Record<string, unknown> }>(`/admin/orders/${id}`),
    updateOrderStatus: (id: number, status: string) =>
      request<{ success: boolean; data: Record<string, unknown>; message: string }>(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    customers: (q = '') => request<{ success: boolean; data: User[] }>(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    customer: (id: number) => request<{ success: boolean; data: User }>(`/admin/customers/${id}`),
    toggleBlock: (id: number, is_blocked: boolean) =>
      request<{ success: boolean; message: string }>(`/admin/customers/${id}/block`, { method: 'PUT', body: JSON.stringify({ is_blocked }) }),
    coupons: () => request<{ success: boolean; data: Coupon[] }>('/admin/coupons'),
    createCoupon: (data: Record<string, unknown>) => request<{ success: boolean; data: { id: number }; message: string }>('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
    updateCoupon: (id: number, data: Record<string, unknown>) => request<{ success: boolean; message: string }>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCoupon: (id: number) => request<{ success: boolean; message: string }>(`/admin/coupons/${id}`, { method: 'DELETE' }),
    inventory: () => request<{ success: boolean; data: { products: Array<Record<string, unknown>>; low: Array<Record<string, unknown>>; out: Array<Record<string, unknown>> } }>('/admin/inventory'),
    adjustStock: (data: { product_id: number; quantity: number; reason?: string }) =>
      request<{ success: boolean; data: { id: number; stock: number }; message: string }>('/admin/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
    inventoryHistory: () => request<{ success: boolean; data: Array<Record<string, unknown>> }>('/admin/inventory/history'),
    brands: () => request<{ success: boolean; data: Array<Record<string, unknown>> }>('/admin/brands'),
    createBrand: (data: { name: string }) => request<{ success: boolean; data: { id: number }; message: string }>('/admin/brands', { method: 'POST', body: JSON.stringify(data) }),
    updateBrand: (id: number, data: { name: string }) => request<{ success: boolean; message: string }>(`/admin/brands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBrand: (id: number) => request<{ success: boolean; message: string }>(`/admin/brands/${id}`, { method: 'DELETE' }),
  },
}