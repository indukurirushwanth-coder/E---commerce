import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { IconBag, IconEye, IconEyeOff, IconLock, IconMail } from '@/components/ui/icons'
import { ButtonSpinner } from '@/components/ui/Spinner'

const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'customer@shopx.com', password: 'customer123' },
  { label: 'Admin', email: 'admin@shopx.com', password: 'admin123' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await login(email.trim(), password)
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  const fillDemo = (em: string, pw: string) => {
    setEmail(em)
    setPassword(pw)
    setError('')
  }

  return (
    <div className="container-shopx flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-cardHover">
            <IconBag className="h-7 w-7" />
          </span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Log in to your ShopX account</p>
        </div>

        <div className="card mt-8 p-6 sm:p-8">
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

            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="mb-1.5 text-xs font-semibold text-brand-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <IconLock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input !pl-10 !pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <><ButtonSpinner /> Logging in…</> : 'Login'}
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-ink-200" />
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Try a demo account</span>
              <div className="h-px flex-1 bg-ink-200" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => fillDemo(d.email, d.password)}
                  className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-ink-400">Click to fill demo credentials</p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
