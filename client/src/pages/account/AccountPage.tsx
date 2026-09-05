import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { api } from '@/api/client'
import type { Notification } from '@/types'
import { Spinner } from '@/components/ui/Spinner'
import {
  IconUser,
  IconMapPin,
  IconBag,
  IconHeart,
  IconStar,
  IconTag,
  IconBell,
  IconLock,
  IconChevronRight,
  IconLogout,
} from '@/components/ui/icons'

const sections = [
  { key: 'profile', title: 'Profile', desc: 'Manage your personal info', icon: IconUser, path: '/account/profile' },
  { key: 'addresses', title: 'Addresses', desc: 'Saved delivery addresses', icon: IconMapPin, path: '/account/addresses' },
  { key: 'orders', title: 'Orders', desc: 'Track & manage orders', icon: IconBag, path: '/account/orders' },
  { key: 'wishlist', title: 'Wishlist', desc: 'Your saved favourites', icon: IconHeart, path: '/account/wishlist' },
  { key: 'reviews', title: 'Reviews', desc: 'Your product reviews', icon: IconStar, path: '/account/reviews' },
  { key: 'coupons', title: 'Coupons', desc: 'Available discount codes', icon: IconTag, path: '/account/coupons' },
  { key: 'notifications', title: 'Notifications', desc: 'Alerts & updates', icon: IconBell, path: '/account/notifications' },
  { key: 'security', title: 'Security', desc: 'Password & account safety', icon: IconLock, path: '/account/security' },
]

export default function AccountPage() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const location = useLocation()
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchNotifications() {
      try {
        const res = await api.getNotifications()
        if (!cancelled) {
          setNotificationCount(res.data.filter((n: Notification) => !n.is_read).length)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchNotifications()
    return () => { cancelled = true }
  }, [])

  const counts: Record<string, number> = {
    orders: itemCount,
    wishlist: wishlistCount,
    notifications: notificationCount,
  }

  const isActive = (path: string) => location.pathname === path

  if (loading) {
    return (
      <div className="container-shopx mx-auto px-4 py-16">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="container-shopx mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar - desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.full_name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-900">{user?.full_name}</p>
                <p className="truncate text-xs text-ink-500">{user?.email}</p>
              </div>
            </div>

            <nav className="mt-5 space-y-1">
              {sections.map((s) => {
                const Icon = s.icon
                const active = isActive(s.path)
                return (
                  <Link
                    key={s.key}
                    to={s.path}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{s.title}</span>
                    {counts[s.key] !== undefined && counts[s.key] > 0 && (
                      <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-600">
                        {counts[s.key]}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <button
              onClick={logout}
              className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-red-50 transition-colors"
            >
              <IconLogout className="h-5 w-5 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Greeting */}
          <div className="mb-8 flex items-center gap-4">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.full_name} className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-100 lg:hidden" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white lg:hidden ring-2 ring-brand-100">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-ink-900">
                Hello, {user?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-sm text-ink-500">Welcome to your account dashboard</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-ink-100 bg-white p-4 text-center shadow-card">
              <p className="text-2xl font-bold text-brand-600">{itemCount}</p>
              <p className="mt-1 text-xs font-medium text-ink-500">Total Orders</p>
            </div>
            <div className="rounded-xl border border-ink-100 bg-white p-4 text-center shadow-card">
              <p className="text-2xl font-bold text-red-500">{wishlistCount}</p>
              <p className="mt-1 text-xs font-medium text-ink-500">Wishlist</p>
            </div>
            <div className="rounded-xl border border-ink-100 bg-white p-4 text-center shadow-card">
              <p className="text-2xl font-bold text-accent-500">{notificationCount}</p>
              <p className="mt-1 text-xs font-medium text-ink-500">Notifications</p>
            </div>
          </div>

          {/* Section cards - mobile grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {sections.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.key}
                  to={s.path}
                  className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-ink-900">{s.title}</h3>
                      {counts[s.key] !== undefined && counts[s.key] > 0 && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-600">
                          {counts[s.key]}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">{s.desc}</p>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
                </Link>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
