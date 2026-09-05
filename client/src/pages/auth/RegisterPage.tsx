import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { IconBag, IconEye, IconEyeOff, IconLock, IconMail, IconPhone, IconUser } from '@/components/ui/icons'
import { ButtonSpinner } from '@/components/ui/Spinner'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (fullName.trim().length < 2) e.fullName = 'Please enter your full name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address'
    if (phone.trim() && phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number'
    if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (confirm !== password) e.confirm = 'Passwords do not match'
    return e
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setLoading(true)
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      })
      navigate('/')
    } catch (err: any) {
      setErrors({ form: err?.message || 'Could not create your account. Please try again.' })
      setLoading(false)
    }
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
          <h1 className="text-2xl font-extrabold text-ink-900">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">Join ShopX to start shopping</p>
        </div>

        <div className="card mt-8 p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            {errors.form && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{errors.form}</div>
            )}

            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <div className="relative">
                <IconUser className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="fullName"
                  className={`input !pl-10 ${errors.fullName ? '!border-red-400' : ''}`}
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs font-medium text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <IconMail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  className={`input !pl-10 ${errors.email ? '!border-red-400' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="label" htmlFor="phone">Phone <span className="font-normal normal-case text-ink-400">(optional)</span></label>
              <div className="relative">
                <IconPhone className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="phone"
                  className={`input !pl-10 ${errors.phone ? '!border-red-400' : ''}`}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <IconLock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input !pl-10 !pr-10 ${errors.password ? '!border-red-400' : ''}`}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
              {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <div className="relative">
                <IconLock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className={`input !pl-10 !pr-10 ${errors.confirm ? '!border-red-400' : ''}`}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.confirm && <p className="mt-1 text-xs font-medium text-red-600">{errors.confirm}</p>}
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <><ButtonSpinner /> Creating account…</> : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
