import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { Order, OrderItem } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { IconChevronLeft } from '@/components/ui/icons'
import { formatPrice, formatDate, formatDateTime, humanizeStatus } from '@/lib/format'

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    api.admin.order(Number(id))
      .then((res) => setOrder(res.data))
      .catch(() => toast('Failed to load order', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (status: string) => {
    if (!id) return
    setUpdating(true)
    try {
      await api.admin.updateOrderStatus(Number(id), status)
      setOrder((prev: any) => ({ ...prev, status }))
      toast('Order status updated')
    } catch {
      toast('Failed to update status', 'error')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center"><Spinner /></div>
    )
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-ink-500">Order not found</div>
    )
  }

  const items: OrderItem[] = order.items || []
  const address = order.address

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl">
      <button
        onClick={() => navigate('/admin/orders')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
      >
        <IconChevronLeft className="h-4 w-4" /> Back to Orders
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Order #{order.order_number}</h1>
          <p className="mt-1 text-sm text-ink-500">Placed on {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-ink-600">Status:</label>
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
            className="input w-auto min-w-[160px]"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {updating && <Spinner size="sm" />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer & Address */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-bold text-ink-900">Customer</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-ink-500">Name: </span>
              <span className="font-medium text-ink-900">{order.customer_name || order.full_name || '—'}</span>
            </div>
            <div>
              <span className="text-ink-500">Email: </span>
              <span className="text-ink-700">{order.customer_email || order.email || '—'}</span>
            </div>
            <div>
              <span className="text-ink-500">Phone: </span>
              <span className="text-ink-700">{order.customer_phone || order.phone || '—'}</span>
            </div>
          </div>

          {address && (
            <>
              <h3 className="text-sm font-bold text-ink-900 pt-3 border-t border-ink-100">Shipping Address</h3>
              <div className="text-sm text-ink-600 leading-relaxed">
                <p>{address.full_name}</p>
                <p>{address.house}</p>
                <p>{address.city}, {address.state} {address.pin_code}</p>
                <p>{address.country}</p>
                <p className="text-ink-500 mt-1">{address.phone}</p>
              </div>
            </>
          )}
        </div>

        {/* Order Items */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-ink-900">Items ({items.length})</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl bg-ink-50 p-3">
                <img
                  src={item.image || ''}
                  alt={item.product_name}
                  className="h-14 w-14 rounded-lg object-cover bg-ink-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink-900 line-clamp-1">{item.product_name}</p>
                  {item.variant_name && <p className="text-xs text-ink-500">{item.variant_name}</p>}
                  <p className="text-xs text-ink-500">Qty: {item.quantity} &times; {formatPrice(item.price)}</p>
                </div>
                <p className="font-bold text-ink-900 text-sm">{formatPrice(item.total)}</p>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-ink-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Subtotal</span>
              <span className="text-ink-900">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-500">Discount</span>
                <span className="text-emerald-600">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-500">Delivery</span>
              <span className="text-ink-900">{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : 'Free'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Tax</span>
              <span className="text-ink-900">{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2">
              <span className="font-bold text-ink-900">Total</span>
              <span className="font-bold text-ink-900">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink-900 mb-3">Payment</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div>
            <span className="text-ink-500">Method: </span>
            <span className="font-medium text-ink-900 capitalize">{order.payment_method || '—'}</span>
          </div>
          <div>
            <span className="text-ink-500">Status: </span>
            <PaymentBadge status={order.payment_status} />
          </div>
          {order.coupon_code && (
            <div>
              <span className="text-ink-500">Coupon: </span>
              <span className="font-mono text-xs font-semibold text-brand-600">{order.coupon_code}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
