import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import type { User } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { IconUsers, IconSearch, IconChevronRight } from '@/components/ui/icons'
import { formatDate, initials } from '@/lib/format'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [blockTarget, setBlockTarget] = useState<any>(null)
  const [acting, setActing] = useState(false)
  const { toast } = useToast()

  const load = (q?: string) => {
    setLoading(true)
    api.admin.customers(q || '')
      .then((res) => setCustomers(res.data))
      .catch(() => toast('Failed to load customers', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = () => {
    load(search)
  }

  const toggleBlock = async () => {
    if (!blockTarget) return
    setActing(true)
    try {
      await api.admin.toggleBlock(blockTarget.id, !blockTarget.is_blocked)
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === blockTarget.id ? { ...c, is_blocked: c.is_blocked ? 0 : 1 } : c,
        ),
      )
      toast(blockTarget.is_blocked ? 'Customer unblocked' : 'Customer blocked')
      setBlockTarget(null)
    } catch {
      toast('Failed to update', 'error')
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Customers</h1>
        <p className="mt-1 text-sm text-ink-500">{customers.length} customers</p>
      </div>

      <div className="flex gap-3 max-w-md">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input pl-10"
          />
        </div>
        <button onClick={handleSearch} className="btn-outline">Search</button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center"><Spinner /></div>
      ) : customers.length === 0 ? (
        <EmptyState icon={<IconUsers className="h-12 w-12" />} title="No customers found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {c.avatar ? (
                            <img src={c.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            initials(c.full_name || 'U')
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">{c.full_name}</p>
                          <p className="text-xs text-ink-400">{c.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{c.phone || '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink-700">{c.orders_count ?? 0}</td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3">
                      {c.is_blocked ? (
                        <span className="badge bg-red-100 text-red-700">Blocked</span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setBlockTarget(c)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            c.is_blocked
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {c.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                        <Link
                          to={`/admin/customers/${c.id}`}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        >
                          <IconChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!blockTarget}
        title={blockTarget?.is_blocked ? 'Unblock Customer' : 'Block Customer'}
        message={
          blockTarget?.is_blocked
            ? `Unblock ${blockTarget?.full_name}? They will be able to use the platform again.`
            : `Block ${blockTarget?.full_name}? They won't be able to place orders.`
        }
        confirmLabel={blockTarget?.is_blocked ? 'Unblock' : 'Block'}
        danger={!blockTarget?.is_blocked}
        loading={acting}
        onConfirm={toggleBlock}
        onClose={() => setBlockTarget(null)}
      />
    </div>
  )
}
