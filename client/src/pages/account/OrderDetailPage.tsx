import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { Order } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner, ButtonSpinner } from '@/components/ui/Spinner'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { IconChevronRight, IconChevronLeft, IconCheckCircle, IconBag, IconDoc, IconTruck, IconPackage, IconX } from '@/components/ui/icons'
import { formatPrice, formatDate, humanizeStatus, stageIndex, ORDER_FLOW } from '@/lib/format'

interface TrackingStage {
  key: string
  label: string
  completed: boolean
  active: boolean
}

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

function paymentStatusColor(status: string) {
  switch (status) {
    case 'paid': return 'text-emerald-600'
    case 'pending': return 'text-amber-600'
    case 'failed': return 'text-red-600'
    case 'refunded': return 'text-blue-600'
    default: return 'text-ink-500'
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [tracking, setTracking] = useState<{ stages: TrackingStage[]; estimated_delivery?: string | null; cancelled: boolean; return_requested: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Return dialog
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnReason, setReturnReason] = useState('')

  const fetchOrder = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [orderRes, trackingRes] = await Promise.all([
        api.getOrder(Number(id)),
        api.getOrderTracking(Number(id)),
      ])
      setOrder(orderRes.data)
      setTracking(trackingRes.data)
    } catch {
      toast('Failed to load order details', 'error')
      navigate('/account/orders')
    } finally {
      setLoading(false)
    }
  }, [id, toast, navigate])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  const canCancel = order && ['processing', 'ordered', 'confirmed'].includes(order.status) && !tracking?.cancelled
  const canReturn = order && order.status === 'delivered' && !tracking?.return_requested

  const handleCancel = async () => {
    if (!order) return
    setActionLoading(true)
    try {
      await api.cancelOrder(order.id, cancelReason || undefined)
      toast('Order cancelled')
      setCancelOpen(false)
      fetchOrder()
    } catch (err: any) {
      toast(err.message || 'Failed to cancel order', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!order) return
    setActionLoading(true)
    try {
      await api.requestReturn(order.id, returnReason || undefined)
      toast('Return request submitted')
      setReturnOpen(false)
      fetchOrder()
    } catch (err: any) {
      toast(err.message || 'Failed to request return', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!order) return
    try {
      const res = await api.getOrderInvoice(order.id)
      toast('Invoice details loaded')
    } catch (err: any) {
      toast(err.message || 'Failed to download invoice', 'error')
    }
  }

  if (loading) {
    return (
      <div className="container-shopx mx-auto px-4 py-16">
        <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>
      </div>
    )
  }

  if (!order) return null

  const currentIdx = stageIndex(order.status)

  return (
    <div className="container-shopx mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/account" className="hover:text-brand-600">Account</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <Link to="/account/orders" className="hover:text-brand-600">Orders</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-900">#{order.order_number}</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Order #{order.order_number}</h1>
          <p className="mt-1 text-sm text-ink-500">Placed on {formatDate(order.created_at)}</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusColor(order.status)}`}>
          {humanizeStatus(order.status)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tracking Timeline */}
          {tracking && !tracking.cancelled && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="mb-4 text-base font-bold text-ink-900">Order Timeline</h2>
              <div className="flex items-center justify-between">
                {tracking.stages.map((stage, i) => (
                  <div key={stage.key} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          stage.completed
                            ? 'bg-brand-600 text-white'
                            : stage.active
                              ? 'border-2 border-brand-600 text-brand-600'
                              : 'bg-ink-100 text-ink-400'
                        }`}
                      >
                        {stage.completed ? <IconCheckCircle className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className={`mt-1.5 text-[11px] font-medium ${stage.completed || stage.active ? 'text-ink-900' : 'text-ink-400'}`}>
                        {stage.label}
                      </span>
                    </div>
                    {i < tracking.stages.length - 1 && (
                      <div className={`mx-1 h-0.5 flex-1 rounded ${stage.completed ? 'bg-brand-600' : 'bg-ink-200'}`} />
                    )}
                  </div>
                ))}
              </div>
              {tracking.estimated_delivery && (
                <p className="mt-4 text-sm text-ink-500">
                  Estimated delivery: <span className="font-semibold text-ink-900">{formatDate(tracking.estimated_delivery)}</span>
                </p>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold text-ink-900">Order Items</h2>
            <div className="divide-y divide-ink-100">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                    {item.image ? (
                      <img src={item.image} alt={item.product_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ink-300">
                        <IconPackage className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{item.product_name}</p>
                    {item.variant_name && <p className="mt-0.5 text-xs text-ink-500">{item.variant_name}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">{formatPrice(item.price)}</span>
                      <span className="text-xs text-ink-400">x {item.quantity}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-ink-900">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          {order.address && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="mb-3 text-base font-bold text-ink-900">Delivery Address</h2>
              <p className="text-sm font-medium text-ink-900">{order.address.full_name}</p>
              <p className="text-sm text-ink-600">{order.address.house}, {order.address.city}, {order.address.state} - {order.address.pin_code}</p>
              <p className="text-xs text-ink-500 mt-1">Phone: {order.address.phone}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-base font-bold text-ink-900">Price Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-medium text-ink-900">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Discount</span>
                  <span className="font-medium text-emerald-600">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-500">Delivery Fee</span>
                <span className="font-medium text-ink-900">{order.delivery_fee === 0 ? 'Free' : formatPrice(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Tax</span>
                <span className="font-medium text-ink-900">{formatPrice(order.tax)}</span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Coupon ({order.coupon_code})</span>
                  <span className="font-medium text-brand-600">Applied</span>
                </div>
              )}
              <div className="border-t border-ink-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-ink-900">Total</span>
                  <span className="text-lg font-bold text-ink-900">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="mb-3 text-base font-bold text-ink-900">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Method</span>
                <span className="font-medium text-ink-900 capitalize">{order.payment_method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Status</span>
                <span className={`font-semibold capitalize ${paymentStatusColor(order.payment_status)}`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card space-y-3">
            <h2 className="text-base font-bold text-ink-900">Actions</h2>
            {canCancel && (
              <button onClick={() => setCancelOpen(true)} className="w-full btn-danger flex items-center justify-center gap-2 text-sm">
                <IconX className="h-4 w-4" />
                Cancel Order
              </button>
            )}
            {canReturn && (
              <button onClick={() => setReturnOpen(true)} className="w-full btn-outline flex items-center justify-center gap-2 text-sm border-amber-300 text-amber-700 hover:bg-amber-50">
                <IconTruck className="h-4 w-4" />
                Request Return
              </button>
            )}
            <button onClick={handleDownloadInvoice} className="w-full btn-outline flex items-center justify-center gap-2 text-sm">
              <IconDoc className="h-4 w-4" />
              Download Invoice
            </button>
            <Link to="/account/orders" className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors">
              <IconChevronLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel="Cancel Order"
        danger
        loading={actionLoading}
        onConfirm={handleCancel}
        onClose={() => { setCancelOpen(false); setCancelReason('') }}
      />

      {/* Return Dialog */}
      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Request Return" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-ink-600">Please provide a reason for your return request.</p>
          <textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            className="input-field min-h-[100px] resize-none"
            placeholder="Reason for return (optional)"
          />
          <div className="flex gap-3">
            <button onClick={handleReturn} disabled={actionLoading} className="btn-primary flex items-center gap-2">
              {actionLoading && <ButtonSpinner />}
              {actionLoading ? 'Submitting...' : 'Submit Return'}
            </button>
            <button onClick={() => { setReturnOpen(false); setReturnReason('') }} className="btn-outline" disabled={actionLoading}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
