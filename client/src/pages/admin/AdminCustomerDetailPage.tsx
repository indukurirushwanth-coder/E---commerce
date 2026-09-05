import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '@/api/client'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/Modal'
import { IconChevronLeft } from '@/components/ui/icons'
import { formatDate, formatPrice, initials, humanizeStatus } from '@/lib/format'

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [blockConfirm, setBlockConfirm] = useState(false)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    if (!id) return
    api.admin.customer(Number(id))
      .then((res) => setCustomer(res.data))
      .catch(() => toast('Failed to load customer', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleBlock = async () => {
    if (!customer || !id) return
    setActing(true)
    try {
      await api.admin.toggleBlock(Number(id), !customer.is_blocked)
      setCustomer((prev: any) => ({ ...prev, is_blocked: prev.is_blocked ? 0 : 1 }))
      toast(customer.is_blocked ? 'Customer unblocked' : 'Customer blocked')
      setBlockConfirm(false)
    } catch {
      toast('Failed to update', 'error')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center"><Spinner /></div>
    )
  }

  if (!customer) {
    return <div className="p-8 text-center text-ink-500">Customer not found</div>
  }

  const orders: any[] = customer.orders || customer.recent_orders || []
  const addresses: any[] = customer.addresses || []

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl">
      <button
        onClick={() => navigate('/admin/customers')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
      >
        <IconChevronLeft className="h-4 w-4" /> Back to Customers
      </button>

      {/* Customer Info */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
            {customer.avatar ? (
              <img src={customer.avatar} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              initials(customer.full_name || 'U')
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl font-bold text-ink-900">{customer.full_name}</h1>
              <div className="flex gap-2">
                {customer.is_blocked ? (
                  <span className="badge bg-red-100 text-red-700">Blocked</span>
                ) : (
                  <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                )}
                {customer.role === 'admin' && (
                  <span className="badge bg-violet-100 text-violet-700">Admin</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-ink-500">Email: </span>
                <span className="text-ink-900">{customer.email}</span>
                {customer.email_verified ? (
                  <span className="ml-2 badge bg-emerald-100 text-emerald-700 text-[10px]">Verified</span>
                ) : (
                  <span className="ml-2 badge bg-amber-100 text-amber-700 text-[10px]">Unverified</span>
                )}
              </div>
              <div>
                <span className="text-ink-500">Phone: </span>
                <span className="text-ink-900">{customer.phone || '—'}</span>
              </div>
              <div>
                <span className="text-ink-500">Joined: </span>
                <span className="text-ink-900">{formatDate(customer.created_at)}</span>
              </div>
              <div>
                <span className="text-ink-500">Role: </span>
                <span className="text-ink-900 capitalize">{customer.role}</span>
              </div>
            </div>

            <button
              onClick={() => setBlockConfirm(true)}
              className={`mt-2 text-sm font-semibold ${
                customer.is_blocked
                  ? 'text-emerald-600 hover:text-emerald-700'
                  : 'text-red-600 hover:text-red-700'
              }`}
            >
              {customer.is_blocked ? 'Unblock this customer' : 'Block this customer'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-base font-bold text-ink-900">Recent Orders ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-ink-400 text-sm">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-semibold text-brand-600 hover:text-brand-700">
                        #{o.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink-900">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Addresses */}
      {addresses.length > 0 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-bold text-ink-900">Addresses</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addresses.map((addr: any) => (
              <div key={addr.id} className="rounded-xl border border-ink-200 p-4 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-ink-900">{addr.full_name}</p>
                  {addr.is_default && (
                    <span className="badge bg-brand-100 text-brand-700">Default</span>
                  )}
                </div>
                <p className="text-ink-600">{addr.house}</p>
                <p className="text-ink-600">{addr.city}, {addr.state} {addr.pin_code}</p>
                <p className="text-ink-600">{addr.country}</p>
                <p className="text-ink-500 mt-1">{addr.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blockConfirm}
        title={customer.is_blocked ? 'Unblock Customer' : 'Block Customer'}
        message={
          customer.is_blocked
            ? `Unblock ${customer.full_name}? They will regain access.`
            : `Block ${customer.full_name}? They won't be able to place orders.`
        }
        confirmLabel={customer.is_blocked ? 'Unblock' : 'Block'}
        danger={!customer.is_blocked}
        loading={acting}
        onConfirm={toggleBlock}
        onClose={() => setBlockConfirm(false)}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-violet-100 text-violet-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return <span className={`badge ${colors[status] || 'bg-ink-100 text-ink-600'}`}>{humanizeStatus(status)}</span>
}
