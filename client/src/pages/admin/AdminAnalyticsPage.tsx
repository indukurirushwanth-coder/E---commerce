import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { AnalyticsData } from '@/types'
import { Spinner } from '@/components/ui/Spinner'
import { IconChart } from '@/components/ui/icons'
import { formatPrice } from '@/lib/format'

type Range = '7d' | '30d' | '90d' | '12m'

const RANGES: { key: Range; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '12m', label: '12 Months' },
]

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<Range>('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.admin.analytics(range)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [range])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center"><Spinner /></div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
          <p className="mt-1 text-sm text-ink-500">Performance insights for your store</p>
        </div>

        <div className="flex gap-1 rounded-xl bg-ink-100 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                range === r.key
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Revenue" value={formatPrice(data.revenue)} />
            <StatCard label="Orders" value={String(data.orders)} />
            <StatCard label="Customers" value={String(data.customers)} />
            <StatCard label="Avg Order Value" value={formatPrice(data.avg_order_value)} />
            <StatCard label="Conversion Rate" value={`${(data.conversion_rate || 0).toFixed(1)}%`} />
          </div>

          {/* Customer Growth Chart */}
          {data.customer_growth && data.customer_growth.length > 0 && (
            <div className="card p-5">
              <h2 className="text-base font-bold text-ink-900 mb-5">Customer Growth</h2>
              <CustomerGrowthChart data={data.customer_growth} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Category Performance */}
            {data.category_performance && data.category_performance.length > 0 && (
              <div className="card overflow-hidden">
                <div className="border-b border-ink-100 px-5 py-4">
                  <h2 className="text-base font-bold text-ink-900">Category Performance</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wider text-ink-400">
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3 text-right">Orders</th>
                        <th className="px-5 py-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {data.category_performance.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-ink-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-ink-900">{c.name || c.category || '—'}</td>
                          <td className="px-5 py-3 text-right text-ink-600">{c.orders ?? c.order_count ?? 0}</td>
                          <td className="px-5 py-3 text-right font-semibold text-ink-900">{formatPrice(c.revenue ?? c.total_revenue ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Performance */}
            {data.product_performance && data.product_performance.length > 0 && (
              <div className="card overflow-hidden">
                <div className="border-b border-ink-100 px-5 py-4">
                  <h2 className="text-base font-bold text-ink-900">Product Performance</h2>
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
                      {data.product_performance.map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-ink-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-ink-900 line-clamp-1">{p.name || p.product_name || '—'}</td>
                          <td className="px-5 py-3 text-right text-ink-600">{p.sold_count ?? p.sold ?? 0}</td>
                          <td className="px-5 py-3 text-right font-semibold text-ink-900">{formatPrice(p.revenue ?? p.total_revenue ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-ink-900">{value}</p>
    </div>
  )
}

function CustomerGrowthChart({ data }: { data: Array<{ d: string; c: number }> }) {
  const max = Math.max(...data.map((d) => d.c), 1)

  return (
    <div className="flex items-end gap-1.5" style={{ height: 160 }}>
      {data.map((day) => {
        const pct = max > 0 ? (day.c / max) * 100 : 0
        return (
          <div key={day.d} className="group flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-ink-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {day.c}
            </span>
            <div
              className="w-full rounded-t-lg bg-violet-500 transition-all group-hover:bg-violet-600"
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <span className="text-[10px] text-ink-400">
              {new Date(day.d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
