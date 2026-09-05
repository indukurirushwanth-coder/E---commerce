import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { Coupon } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { IconPlus, IconEdit, IconTrash, IconTag } from '@/components/ui/icons'
import { formatPrice, formatDate } from '@/lib/format'

interface CouponForm {
  code: string
  description: string
  type: 'percent' | 'fixed'
  value: string
  min_order_amount: string
  max_discount_amount: string
  expiry_date: string
  usage_limit: string
  is_active: boolean
}

const EMPTY_FORM: CouponForm = {
  code: '',
  description: '',
  type: 'percent',
  value: '',
  min_order_amount: '',
  max_discount_amount: '',
  expiry_date: '',
  usage_limit: '',
  is_active: true,
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    api.admin.coupons()
      .then((res) => setCoupons(res.data))
      .catch(() => toast('Failed to load coupons', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditId(coupon.id)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: String(coupon.value),
      min_order_amount: String(coupon.min_order_amount || ''),
      max_discount_amount: String(coupon.max_discount_amount || ''),
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
      usage_limit: String(coupon.usage_limit || ''),
      is_active: coupon.is_active !== 0,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.value) {
      toast('Code and value are required', 'error')
      return
    }
    setSaving(true)
    const payload: Record<string, unknown> = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      type: form.type,
      value: Number(form.value),
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      expiry_date: form.expiry_date || null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      is_active: form.is_active,
    }
    try {
      if (editId) {
        await api.admin.updateCoupon(editId, payload)
        toast('Coupon updated')
      } else {
        await api.admin.createCoupon(payload)
        toast('Coupon created')
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      toast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.admin.deleteCoupon(deleteTarget.id)
      toast('Coupon deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast('Failed to delete', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Coupons</h1>
          <p className="mt-1 text-sm text-ink-500">{coupons.length} coupons</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <IconPlus className="h-4 w-4" /> Add Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center"><Spinner /></div>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={<IconTag className="h-12 w-12" />}
          title="No coupons"
          description="Create your first coupon code"
          action={<button onClick={openAdd} className="btn-primary"><IconPlus className="h-4 w-4" /> Add Coupon</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Value</th>
                  <th className="px-5 py-3 text-right">Min Order</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3">Usage</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {coupons.map((coupon) => {
                  const expired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date()
                  return (
                    <tr key={coupon.id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono font-bold text-brand-600">{coupon.code}</span>
                        {coupon.description && (
                          <p className="text-xs text-ink-400 mt-0.5 line-clamp-1">{coupon.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="badge bg-ink-100 text-ink-600">
                          {coupon.type === 'percent' ? 'Percent' : 'Fixed'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-ink-900">
                        {coupon.type === 'percent' ? `${coupon.value}%` : formatPrice(coupon.value)}
                      </td>
                      <td className="px-5 py-3 text-right text-ink-600">
                        {coupon.min_order_amount > 0 ? formatPrice(coupon.min_order_amount) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={expired ? 'text-red-500' : 'text-ink-600'}>
                          {coupon.expiry_date ? formatDate(coupon.expiry_date) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-600">
                        {coupon.used_count ?? 0}
                        {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                      </td>
                      <td className="px-5 py-3">
                        {coupon.is_active ? (
                          <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                        ) : (
                          <span className="badge bg-ink-100 text-ink-500">Inactive</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(coupon)}
                            className="rounded-lg p-2 text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(coupon)}
                            className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Coupon' : 'Add Coupon'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="input font-mono"
                placeholder="SAVE20"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
                className="input"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Value *</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="input"
                placeholder={form.type === 'percent' ? '20' : '100'}
                min="0"
              />
            </div>
            <div>
              <label className="label">Min Order Amount</label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                className="input"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="label">Max Discount</label>
              <input
                type="number"
                value={form.max_discount_amount}
                onChange={(e) => setForm((f) => ({ ...f, max_discount_amount: e.target.value }))}
                className="input"
                placeholder="No limit"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Expiry Date</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Usage Limit</label>
              <input
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                className="input"
                placeholder="Unlimited"
                min="0"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-ink-700">Active</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`Delete coupon "${deleteTarget?.code}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
