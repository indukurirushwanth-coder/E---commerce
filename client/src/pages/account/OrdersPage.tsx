import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { Order, Pagination } from '@/types'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconChevronRight, IconBag, IconChevronLeft } from '@/components/ui/icons'
import { formatPrice, formatDate, humanizeStatus } from '@/lib/format'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

function statusColor(status: string) {
  switch (status) {
    case 'delivered': return 'bg-emerald-100 text-emerald-700'
    case 'shipped': return 'bg-blue-100 text-blue-700'
    case 'processing': return 'bg-amber-100 text-amber-700'
    case 'cancelled': return 'bg-red-100 text-red-700'
    case 'out_for_delivery': return 'bg-indigo-100 text-indigo-700'
    default: return 'bg-ink-100 text-ink-600'
  }
}

export default function OrdersPage() {
  const [params, setParams] = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, perPage: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  const page = Number(params.get('page')) || 1
  const status = params.get('status') || ''

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getOrders({ page, status: status || undefined })
      setOrders(res.data)
      setPagination(res.pagination)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const setStatusFilter = (s: string) => {
    const next = new URLSearchParams(params)
    if (s) next.set('status', s)
    else next.delete('status')
    next.delete('page')
    setParams(next)
  }

  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
  }

  return (
    <div className="container-shopx mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/account" className="hover:text-brand-600">Account</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-900">Orders</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-ink-900">My Orders</h1>

      {/* Status tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.key || (!status && !tab.key)
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Spinner /></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<IconBag className="h-12 w-12" />}
          title="No orders found"
          description={status ? 'Try selecting a different filter' : 'Start shopping to see your orders here'}
          action={
            <Link to="/products" className="btn-primary text-sm">
              Browse Products
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <IconBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900">#{order.order_number}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(order.status)}`}>
                    {humanizeStatus(order.status)}
                  </span>
                  <span className="text-sm font-bold text-ink-900">{formatPrice(order.total)}</span>
                  <span className="text-xs text-ink-400">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-brand-600 text-white'
                      : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
