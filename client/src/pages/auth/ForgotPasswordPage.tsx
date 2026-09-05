import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { IconBack, IconCheckCircle, IconMail } from '@/components/ui/icons'
import { ButtonSpinner } from '@/components/ui/Spinner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.forgotPassword(email.trim())
      setDone(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-shopx flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-cardHover">
            <IconMail className="h-7 w-7" />
          </span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-ink-900">Forgot password?</h1>
          <p className="mt-1 text-sm text-ink-500">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="card mt-8 p-6 sm:p-8">
          {done ? (
            <div className="flex flex-col items-center py-4 text-center">
              <IconCheckCircle className="h-14 w-14 text-emerald-500" />
              <h2 className="mt-4 text-lg font-bold text-ink-900">Check your email for reset link</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                If an account exists for <span className="font-semibold text-ink-800">{email}</span>, we've sent instructions to reset
                your password. The link expires in a few minutes.
              </p>
              <Link to="/login" className="btn-primary mt-6">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
              )}

              <div>
                <label className="label" htmlFor="email">Email</label>
                <div className="relative">
                  <IconMail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                  <input
                    id="email"
                    type="email"
                    className="input !pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? <><ButtonSpinner /> Sending…</> : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        {!done && (
          <p className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
              <IconBack className="h-4 w-4" /> Back to login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
