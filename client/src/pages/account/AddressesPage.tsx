import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import type { Address } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner, ButtonSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { IconChevronRight, IconMapPin, IconPlus, IconEdit, IconTrash, IconCheckCircle } from '@/components/ui/icons'
import { ConfirmDialog } from '@/components/ui/Modal'

const EMPTY_FORM: Omit<Address, 'id' | 'user_id'> = {
  full_name: '',
  phone: '',
  house: '',
  city: '',
  state: '',
  pin_code: '',
  country: 'India',
  is_default: 0,
}

export default function AddressesPage() {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Omit<Address, 'id' | 'user_id'>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await api.getAddresses()
      setAddresses(res.data)
    } catch {
      toast('Failed to load addresses', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchAddresses() }, [fetchAddresses])

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (addr: Address) => {
    setEditingId(addr.id)
    setForm({
      full_name: addr.full_name,
      phone: addr.phone,
      house: addr.house,
      city: addr.city,
      state: addr.state,
      pin_code: addr.pin_code,
      country: addr.country,
      is_default: addr.is_default,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.phone.trim() || !form.house.trim() || !form.city.trim() || !form.state.trim() || !form.pin_code.trim()) {
      toast('Please fill all required fields', 'error')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const res = await api.updateAddress(editingId, form)
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? res.data : a)))
        toast('Address updated')
      } else {
        const res = await api.createAddress(form)
        setAddresses((prev) => [...prev, res.data])
        toast('Address added')
      }
      setFormOpen(false)
    } catch (err: any) {
      toast(err.message || 'Failed to save address', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteAddress(deleteTarget.id)
      setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      toast('Address deleted')
    } catch (err: any) {
      toast(err.message || 'Failed to delete address', 'error')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleSetDefault = async (addr: Address) => {
    try {
      const res = await api.updateAddress(addr.id, { is_default: 1 })
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === addr.id ? 1 : 0,
        }))
      )
      toast('Default address set')
    } catch (err: any) {
      toast(err.message || 'Failed to set default', 'error')
    }
  }

  if (loading) {
    return (
      <div className="container-shopx mx-auto px-4 py-16">
        <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>
      </div>
    )
  }

  return (
    <div className="container-shopx mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/account" className="hover:text-brand-600">Account</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-900">Addresses</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">My Addresses</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <IconPlus className="h-4 w-4" />
          Add New
        </button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={<IconMapPin className="h-12 w-12" />}
          title="No saved addresses"
          description="Add a delivery address to make checkout faster"
          action={
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
              <IconPlus className="h-4 w-4" />
              Add Address
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-2xl border bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover ${
                addr.is_default ? 'border-brand-300 ring-1 ring-brand-100' : 'border-ink-100'
              }`}
            >
              {addr.is_default === 1 && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
                  <IconCheckCircle className="h-3.5 w-3.5" />
                  Default
                </span>
              )}
              <p className="text-sm font-bold text-ink-900">{addr.full_name}</p>
              <p className="mt-0.5 text-xs text-ink-500">{addr.phone}</p>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">
                {addr.house}, {addr.city}, {addr.state} - {addr.pin_code}
              </p>
              <p className="text-xs text-ink-400">{addr.country}</p>

              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => openEdit(addr)} className="btn-outline flex items-center gap-1.5 text-xs py-1.5 px-3">
                  <IconEdit className="h-3.5 w-3.5" />
                  Edit
                </button>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr)} className="text-xs font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5">
                    Set as default
                  </button>
                )}
                <button
                  onClick={() => setDeleteTarget(addr)}
                  className="ml-auto text-danger hover:text-red-700 p-1.5"
                  aria-label="Delete address"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Edit Address' : 'Add New Address'}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Full Name *</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Phone *</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">House / Building / Street *</label>
            <input type="text" value={form.house} onChange={(e) => setForm({ ...form, house: e.target.value })} className="input-field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">City *</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">State *</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">PIN Code *</label>
              <input type="text" value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Country</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input-field" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_default === 1}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked ? 1 : 0 })}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-ink-700">Set as default address</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <ButtonSpinner />}
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add Address'}
            </button>
            <button onClick={() => setFormOpen(false)} className="btn-outline" disabled={saving}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Address"
        message={`Are you sure you want to delete the address for ${deleteTarget?.full_name}?`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
