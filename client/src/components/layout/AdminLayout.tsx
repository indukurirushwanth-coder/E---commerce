import { useState } from 'react'
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { initials } from '@/lib/format'
import {
  IconChart,
  IconBag,
  IconGrid,
  IconPackage,
  IconUsers,
  IconTag,
  IconSettings,
  IconBell,
  IconLogout,
  IconSearch,
  IconMenu,
  IconX,
} from '@/components/ui/icons'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: IconChart, end: true },
  { to: '/admin/products', label: 'Products', icon: IconBag },
  { to: '/admin/categories', label: 'Categories', icon: IconGrid },
  { to: '/admin/orders', label: 'Orders', icon: IconPackage },
  { to: '/admin/customers', label: 'Customers', icon: IconUsers },
  { to: '/admin/coupons', label: 'Coupons', icon: IconTag },
  { to: '/admin/inventory', label: 'Inventory', icon: IconSettings },
  { to: '/admin/analytics', label: 'Analytics', icon: IconChart },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-ink-900 text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          SX
        </div>
        {(!collapsed || mobile) && (
          <span className="text-base font-bold tracking-tight">ShopX Admin</span>
        )}
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white"
          >
            <IconX className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-ink-300 hover:bg-ink-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {(!collapsed || mobile) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-800 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-white transition-colors"
        >
          <IconSettings className="h-5 w-5 shrink-0" />
          {(!collapsed || mobile) && <span>View Store</span>}
        </Link>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 transition-all duration-300 lg:block ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full w-72">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-ink-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 lg:block"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div className="relative hidden flex-1 sm:block sm:max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full rounded-xl border border-ink-200 bg-ink-50 py-2 pl-10 pr-4 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700">
              <IconBell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" />
            </button>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-8 w-px bg-ink-200" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {user?.full_name ? initials(user.full_name) : 'A'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-ink-900">{user?.full_name}</p>
                  <p className="text-xs text-ink-400">{user?.email}</p>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <IconLogout className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
