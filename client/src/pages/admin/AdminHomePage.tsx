import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import type { DashboardData } from '@/types'
import { Spinner } from '@/components/ui/Spinner'
import { IconChart, IconBag, IconUsers, IconPackage, IconRefresh, IconChevronRight } from '@/components/ui/icons'
import { formatPrice, formatDate, humanizeStatus } from '@/lib/format'

export default function AdminHomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.dashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!data) return null

  const { stats, sales_chart, top_products, recent_orders, revenue_change, orders_change } = data

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatPrice(stats.total_revenue),
      change: revenue_change,
      icon: IconChart,
      color: 'bg-brand-100 text-brand-600',
    },
    {
      label: 'Total Orders',
      value: stats.total_orders.toLocaleString(),
      change: orders_change,
      icon: IconBag,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Customers',
      value: stats.total_customers.toLocaleString(),
      sub: `+${stats.new_customers_7d} this week`,
      icon: IconUsers,
      color: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Products',
      value: stats.total_products.toLocaleString(),
      sub: stats.low_stock_products > 0 ? `${stats.low_stock_products} low stock` : undefined,
      icon: IconPackage,
      color: 'bg-amber-100 text-amber-600',
    },
  ]

  const maxRevenue = Math.max(...sales_chart.map((d) => d.revenue), 1)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ink-500">{card.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-ink-900">{card.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              {card.change !== undefined && (
                <span
                  className={`text-xs font-semibold ${
                    card.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}%
                </span>
              )}
              {card.sub && !card.change && (
                <span className="text-xs font-medium text-ink-500">{card.sub}</span>
              )}
              {card.change !== undefined && card.sub && (
                <span className="ml-2 text-xs text-ink-400">vs last period</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900">Sales (Last 7 Days)</h2>
          <Link
            to="/admin/analytics"
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View Analytics <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-5 flex items-end gap-2" style={{ height: 180 }}>
          {sales_chart.map((day) => {
            const pct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
            return (
              <div key={day.date} className="group flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-ink-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatPrice(day.revenue)}
                </span>
                <div
                  className="w-full rounded-t-lg bg-brand-500 transition-all group-hover:bg-brand-600"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
                <span className="text-[10px] text-ink-400">
                  {new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Top Products */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-bold text-ink-900">Top Products</h2>
            <Link
              to="/admin/products"
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View all <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Sold</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {top_products.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-ink-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || p.thumbnail || ''}
                          alt={p.name}
                          className="h-9 w-9 rounded-lg object-cover bg-ink-100"
                        />
                        <span className="font-medium text-ink-900 line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-ink-600">{p.sold_count ?? p.sold ?? 0}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink-900">
                      {formatPrice(p.revenue ?? p.total_revenue ?? 0)}
                    </td>
                  </tr>
                ))}
                {top_products.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-ink-400">No data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-bold text-ink-900">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View all <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {recent_orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-ink-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="font-semibold text-brand-600 hover:text-brand-700"
                      >
                        #{o.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-700">{o.customer_name || o.full_name || '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink-900">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
                {recent_orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-ink-400">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats.low_stock_products > 0 && (
        <div className="card border-l-4 border-l-amber-400 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <IconRefresh className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-ink-900">Low Stock Alert</p>
              <p className="text-sm text-ink-500">
                {stats.low_stock_products} product{stats.low_stock_products > 1 ? 's' : ''} running low on stock
                {stats.out_of_stock_products > 0 && (
                  <span className="text-red-500"> &middot; {stats.out_of_stock_products} out of stock</span>
                )}
              </p>
            </div>
            <Link to="/admin/inventory" className="ml-auto btn-outline text-xs">
              Manage Inventory
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-blue-100 text-blue-700',
    packed: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-violet-100 text-violet-700',
    out_for_delivery: 'bg-cyan-100 text-cyan-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`badge ${colors[status] || 'bg-ink-100 text-ink-600'}`}>
      {humanizeStatus(status)}
    </span>
  )
}
