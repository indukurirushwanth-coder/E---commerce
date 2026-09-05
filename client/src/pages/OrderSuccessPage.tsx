import { useLocation, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { formatPrice } from '@/lib/format'
import { IconBag, IconCheckCircle } from '@/components/ui/icons'

const CONFETTI_COLORS = ['#2563eb', '#f97316', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6']

export default function OrderSuccessPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const state = (location.state || {}) as { orderNumber?: string; total?: number }

  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 28 }).map((_, i) => {
          const left = (i * 37) % 100
          const delay = (i % 10) * 0.3
          const duration = 3 + (i % 5)
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
          return (
            <span
              key={i}
              className="absolute top-[-20px] block h-2.5 w-1.5 rounded-sm"
              style={{
                left: `${left}%`,
                backgroundColor: color,
                animation: `confetti ${duration}s ease-in ${delay}s infinite`,
                opacity: 0,
              }}
            />
          )
        })}
        <style>{`
          @keyframes confetti {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(70vh) rotate(360deg); opacity: 0; }
          }
        `}</style>
      </div>

      <div className="container-shopx relative z-10 flex flex-col items-center justify-center py-16 text-center sm:py-20">
        <div className="animate-scale-in">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-cardHover">
            <IconCheckCircle className="h-14 w-14 text-emerald-600" />
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-extrabold text-ink-900 sm:text-4xl">Order Placed Successfully!</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
          Thank you for shopping with ShopX. We've received your order and are preparing it for shipment.
        </p>

        <div className="mt-8 w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-6 shadow-card animate-slide-up">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <span className="text-sm text-ink-500">Order Number</span>
            <span className="text-sm font-bold text-ink-900">{state.orderNumber || `#${orderId}`}</span>
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="flex items-center gap-2 text-sm text-ink-500">
              <IconBag className="h-4.5 w-4.5 text-brand-600" /> Order Total
            </span>
            <span className="text-lg font-extrabold text-ink-900">{state.total != null ? formatPrice(state.total) : '—'}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn-primary px-6 py-3">Continue Shopping</Link>
          <Link to={`/account/orders/${orderId}`} className="btn-outline px-6 py-3">View Order</Link>
        </div>

        <p className="mt-6 text-xs text-ink-400">A confirmation email with your order details has been sent to your inbox.</p>
      </div>
    </div>
  )
}
