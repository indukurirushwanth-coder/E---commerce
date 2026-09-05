import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { IconCheckCircle, IconLock } from '@/components/ui/icons'
import { ButtonSpinner } from '@/components/ui/Spinner'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!token) errs.form = 'Your reset token is missing or invalid. Please request a new reset link.'
    if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (confirm !== password) errs.confirm = 'Passwords do not match'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const res = await api.resetPassword(token, password)
      setStatus('success')
      setMessage(res.message || 'Your password has been reset successfully.')
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.message || 'Could not reset your password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="container-shopx flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card flex flex-col items-center p-8 text-center">
            <IconCheckCircle className="h-14 w-14 text-emerald-500" />
            <h1 className="mt-4 text-xl font-extrabold text-ink-900">Password reset successful</h1>
            <p className="mt-2 text-sm text-ink-500">{message}</p>
            <Link to="/login" className="btn-primary mt-6 w-full">Log in</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-shopx flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-cardHover">
            <IconLock className="h-7 w-7" />
          </span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-ink-900">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-500">Choose a strong password for your account</p>
        </div>

        <div className="card mt-8 p-6 sm:p-8">
          {(status === 'error' || errors.form) && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errors.form || message}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="password">New password</label>
              <div className="relative">
                <IconLock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="password"
                  type="password"
                  className={`input !pl-10 ${errors.password ? '!border-red-400' : ''}`}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label className="label" htmlFor="confirm">Confirm new password</label>
              <div className="relative">
                <IconLock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="confirm"
                  type="password"
                  className={`input !pl-10 ${errors.confirm ? '!border-red-400' : ''}`}
                  placeholder="Re-enter new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirm && <p className="mt-1 text-xs font-medium text-red-600">{errors.confirm}</p>}
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <><ButtonSpinner /> Resetting…</> : 'Reset password'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
