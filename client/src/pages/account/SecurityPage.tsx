import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api } from '@/api/client'
import { Spinner, ButtonSpinner } from '@/components/ui/Spinner'
import { IconChevronRight, IconLock, IconEye, IconEyeOff, IconMail, IconShield, IconCheckCircle, IconX } from '@/components/ui/icons'

export default function SecurityPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [show, setShow] = useState({ old: false, new: false, confirm: false })
  const [submitting, setSubmitting] = useState(false)

  const errors: Record<string, string> = {}
  if (form.new_password && form.new_password.length < 8) {
    errors.new_password = 'Password must be at least 8 characters'
  }
  if (form.confirm_password && form.new_password !== form.confirm_password) {
    errors.confirm_password = 'Passwords do not match'
  }

  const handleSubmit = async () => {
    const errs: Record<string, string> = {}
    if (!form.old_password) errs.old_password = 'Current password is required'
    if (!form.new_password) errs.new_password = 'New password is required'
    if (form.new_password && form.new_password.length < 8) errs.new_password = 'Password must be at least 8 characters'
    if (!form.confirm_password) errs.confirm_password = 'Please confirm your new password'
    if (form.new_password !== form.confirm_password) errs.confirm_password = 'Passwords do not match'
    if (Object.keys(errs).length > 0) {
      Object.values(errs).forEach((m) => toast(m, 'error'))
      return
    }

    setSubmitting(true)
    try {
      const res = await api.changePassword({ old_password: form.old_password, new_password: form.new_password })
      toast(res.message || 'Password changed successfully')
      setForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      toast(err.message || 'Failed to change password', 'error')
    } finally {
      setSubmitting(false)
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
        <span className="font-medium text-ink-900">Security</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-ink-900">Account Security</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Change Password */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <IconLock className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-ink-900">Change Password</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Current Password</label>
              <div className="relative">
                <input
                  type={show.old ? 'text' : 'password'}
                  value={form.old_password}
                  onChange={(e) => setForm({ ...form, old_password: e.target.value })}
                  className="input-field pr-11"
                  placeholder="Enter current password"
                />
                <button
                  onClick={() => setShow({ ...show, old: !show.old })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label="Toggle password visibility"
                >
                  {show.old ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">New Password</label>
              <div className="relative">
                <input
                  type={show.new ? 'text' : 'password'}
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  className="input-field pr-11"
                  placeholder="At least 8 characters"
                />
                <button
                  onClick={() => setShow({ ...show, new: !show.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label="Toggle password visibility"
                >
                  {show.new ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.new_password && <p className="mt-1 text-xs text-danger">{errors.new_password}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Confirm New Password</label>
              <div className="relative">
                <input
                  type={show.confirm ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="input-field pr-11"
                  placeholder="Re-enter new password"
                />
                <button
                  onClick={() => setShow({ ...show, confirm: !show.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label="Toggle password visibility"
                >
                  {show.confirm ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.confirm_password && <p className="mt-1 text-xs text-danger">{errors.confirm_password}</p>}
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-ink-500">
              <IconShield className="h-4 w-4 text-emerald-500" />
              Use at least 8 characters with a mix of letters, numbers and symbols
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              {submitting && <ButtonSpinner />}
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <IconMail className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-ink-900">Account Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Email Address</p>
              <p className="mt-1 text-sm font-medium text-ink-900">{user?.email}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Role</p>
              <p className="mt-1 text-sm font-medium text-ink-900 capitalize">{user?.role || 'Customer'}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Email Verification</p>
              <div className="mt-1 flex items-center gap-2">
                {user?.email_verified ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <IconCheckCircle className="h-3.5 w-3.5" />
                      Verified
                    </span>
                    <span className="text-xs text-ink-500">Your email is verified</span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      <IconX className="h-3.5 w-3.5" />
                      Not verified
                    </span>
                    <span className="text-xs text-ink-500">Verify your email for full access</span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Security tip</p>
              <p className="mt-1 text-xs text-amber-700">
                Never share your password with anyone. ShopX will never ask for your password via email or phone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}