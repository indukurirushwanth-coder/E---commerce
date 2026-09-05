import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api } from '@/api/client'
import { formatDate } from '@/lib/format'
import { Spinner, ButtonSpinner } from '@/components/ui/Spinner'
import { IconChevronRight, IconUser, IconMail, IconPhone, IconCalendar, IconEdit } from '@/components/ui/icons'

export default function ProfilePage() {
  const { user, loading, updateUser, refreshUser } = useAuth()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    avatar: '',
  })

  const startEdit = () => {
    setForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    })
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast('Name is required', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await api.updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        avatar: form.avatar.trim() || undefined,
      })
      updateUser(res.user)
      setEditing(false)
      toast('Profile updated')
    } catch (err: any) {
      toast(err.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
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
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/account" className="hover:text-brand-600">Account</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-900">Profile</span>
      </nav>

      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink-900">My Profile</h1>
          {!editing && (
            <button onClick={startEdit} className="btn-primary flex items-center gap-2 text-sm">
              <IconEdit className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          {/* Avatar + Name */}
          <div className="flex items-center gap-5 mb-6">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.full_name} className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-50" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white ring-4 ring-brand-50">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-ink-900">{user?.full_name}</h2>
              <p className="text-sm text-ink-500">{user?.email}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Avatar URL</label>
                <input
                  type="url"
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
                {form.avatar && (
                  <img src={form.avatar} alt="Preview" className="mt-2 h-12 w-12 rounded-full object-cover" />
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving && <ButtonSpinner />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={cancelEdit} className="btn-outline" disabled={saving}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <InfoRow icon={IconUser} label="Full Name" value={user?.full_name || '—'} />
              <InfoRow icon={IconMail} label="Email" value={user?.email || '—'} />
              <InfoRow icon={IconPhone} label="Phone" value={user?.phone || 'Not set'} />
              <InfoRow icon={IconCalendar} label="Joined" value={formatDate(user?.created_at)} />
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm font-medium text-ink-500">Role</span>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600 capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 shrink-0 text-ink-400" />
      <span className="w-24 shrink-0 text-sm font-medium text-ink-500">{label}</span>
      <span className="text-sm text-ink-900">{value}</span>
    </div>
  )
}
