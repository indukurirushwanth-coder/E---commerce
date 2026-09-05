import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import StoreLayout from '@/components/layout/StoreLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import { Spinner } from '@/components/ui/Spinner'
import NotFoundPage from '@/pages/NotFoundPage'

const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductListPage = lazy(() => import('@/pages/ProductListPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'))

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))

const AccountPage = lazy(() => import('@/pages/account/AccountPage'))
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage'))
const AddressesPage = lazy(() => import('@/pages/account/AddressesPage'))
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage'))
const WishlistPage = lazy(() => import('@/pages/account/WishlistPage'))
const MyReviewsPage = lazy(() => import('@/pages/account/MyReviewsPage'))
const CouponsPage = lazy(() => import('@/pages/account/CouponsPage'))
const NotificationsPage = lazy(() => import('@/pages/account/NotificationsPage'))
const SecurityPage = lazy(() => import('@/pages/account/SecurityPage'))

const AdminHomePage = lazy(() => import('@/pages/admin/AdminHomePage'))
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'))
const AdminProductFormPage = lazy(() => import('@/pages/admin/AdminProductFormPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'))
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'))
const AdminCustomerDetailPage = lazy(() => import('@/pages/admin/AdminCustomerDetailPage'))
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'))
const AdminInventoryPage = lazy(() => import('@/pages/admin/AdminInventoryPage'))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: '/admin' }} />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Store */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
          <Route path="/products" element={<Suspense fallback={<PageLoader />}><ProductListPage /></Suspense>} />
          <Route path="/product/:slug" element={<Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>} />
          <Route path="/search" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
          <Route path="/cart" element={<Suspense fallback={<PageLoader />}><CartPage /></Suspense>} />
          <Route path="/checkout" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense></ProtectedRoute>} />
          <Route path="/order-success/:orderId" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><OrderSuccessPage /></Suspense></ProtectedRoute>} />

          {/* Account */}
          <Route path="/account" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AccountPage /></Suspense></ProtectedRoute>} />
          <Route path="/account/profile" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />
          <Route path="/account/addresses" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AddressesPage /></Suspense></ProtectedRoute>} />
          <Route path="/account/orders" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><OrdersPage /></Suspense></ProtectedRoute>} />
          <Route path="/account/orders/:id" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><OrderDetailPage /></Suspense></ProtectedRoute>} />
          <Route path="/account/wishlist" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><WishlistPage /></Suspense></ProtectedRoute>} />
          <Route path="/account/reviews" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><MyReviewsPage /></Suspense></ProtectedRoute>} />
          <Route path="/account/coupons" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CouponsPage /></Suspense></ProtectedRoute>} />
          <Route path="/account/notifications" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense></ProtectedRoute>} />
          <Route path="/account/security" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><SecurityPage /></Suspense></ProtectedRoute>} />

          {/* Auth */}
          <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
          <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />
          <Route path="/verify-email" element={<Suspense fallback={<PageLoader />}><VerifyEmailPage /></Suspense>} />
          <Route path="/not-found" element={<NotFoundPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Suspense fallback={<PageLoader />}><AdminHomePage /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageLoader />}><AdminProductsPage /></Suspense>} />
          <Route path="products/new" element={<Suspense fallback={<PageLoader />}><AdminProductFormPage /></Suspense>} />
          <Route path="products/:id/edit" element={<Suspense fallback={<PageLoader />}><AdminProductFormPage /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={<PageLoader />}><AdminCategoriesPage /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<PageLoader />}><AdminOrdersPage /></Suspense>} />
          <Route path="orders/:id" element={<Suspense fallback={<PageLoader />}><AdminOrderDetailPage /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<PageLoader />}><AdminCustomersPage /></Suspense>} />
          <Route path="customers/:id" element={<Suspense fallback={<PageLoader />}><AdminCustomerDetailPage /></Suspense>} />
          <Route path="coupons" element={<Suspense fallback={<PageLoader />}><AdminCouponsPage /></Suspense>} />
          <Route path="inventory" element={<Suspense fallback={<PageLoader />}><AdminInventoryPage /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AdminAnalyticsPage /></Suspense>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}