import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { Pagination } from '@/types'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconPackage, IconChevronLeft, IconChevronRight } from '@/components/ui/icons'
import { formatPrice, formatDate, humanizeStatus } from '@/lib/format'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<any[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)

  const status = searchParams.get('status') || ''
  const page = Number(searchParams.get('page') || '1')

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 15 }
    if (status) params.status = status
    api.admin.orders(params)
      .then((res) => {
        setOrders(res.data)
        setPagination(res.pagination)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status, page])

  const setTab = (key: string) => {
    const params = new URLSearchParams(searchParams)
    if (key) params.set('status', key)
    else params.delete('status')
    params.delete('page')
    setSearchParams(params)
  }

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    setSearchParams(params)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Orders</h1>
        <p className="mt-1 text-sm text-ink-500">{pagination?.total ?? '—'} total orders</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.key
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center"><Spinner /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<IconPackage className="h-12 w-12" />} title="No orders found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="font-semibold text-brand-600 hover:text-brand-700"
                      >
                        #{o.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-700">{o.customer_name || o.full_name || '—'}</td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink-900">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3">
                      <PaymentBadge status={o.payment_status} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="btn-outline disabled:opacity-40"
            >
              <IconChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="btn-outline disabled:opacity-40"
            >
              Next <IconChevronRight className="h-4 w-4" />
            </button>
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
  return <span className={`badge ${colors[status] || 'bg-ink-100 text-ink-600'}`}>{humanizeStatus(status)}</span>
}

function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-ink-100 text-ink-600',
  }
  return <span className={`badge ${colors[status] || 'bg-ink-100 text-ink-600'}`}>{humanizeStatus(status)}</span>
}
