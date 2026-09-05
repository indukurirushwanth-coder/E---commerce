import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { IconCheckCircle, IconMail } from '@/components/ui/icons'
import { Spinner } from '@/components/ui/Spinner'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'success' | 'error'>('success')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Your verification link is invalid or incomplete.')
      setLoading(false)
      return
    }
    api
      .verifyEmail(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.message || 'Your email has been verified successfully!')
      })
      .catch((err: any) => {
        setStatus('error')
        setMessage(err?.message || "We couldn't verify your email. The link may have expired.")
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="container-shopx flex min-h-[70vh] flex-col items-center justify-center gap-4 py-12">
        <Spinner size="lg" />
        <p className="text-sm text-ink-500">Verifying your email…</p>
      </div>
    )
  }

  const success = status === 'success'
  return (
    <div className="container-shopx flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card flex flex-col items-center p-8 text-center">
          <span className={`flex h-16 w-16 items-center justify-center rounded-full ${success ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {success ? (
              <IconCheckCircle className="h-9 w-9 text-emerald-600" />
            ) : (
              <svg className="h-9 w-9 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
            )}
          </span>

          <h1 className={`mt-5 text-xl font-extrabold ${success ? 'text-ink-900' : 'text-red-600'}`}>
            {success ? 'Email verified!' : 'Verification failed'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{message}</p>

          {success ? (
            <Link to="/login" className="btn-primary mt-6 w-full">Continue to login</Link>
          ) : (
            <div className="mt-6 w-full space-y-3">
              <Link to="/login" className="btn-outline w-full">Back to login</Link>
              <button
                type="button"
                className="btn-ghost w-full text-brand-600"
                onClick={() => {
                  setLoading(true)
                  api.forgotPassword('').catch(() => {})
                  setLoading(false)
                }}
              >
                <IconMail className="h-4 w-4" /> Resend verification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
