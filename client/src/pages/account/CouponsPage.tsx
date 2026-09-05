import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import type { Coupon } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, CopyButton } from '@/components/ui/EmptyState'
import { IconChevronRight, IconTag } from '@/components/ui/icons'
import { formatPrice, formatDate } from '@/lib/format'

export default function CouponsPage() {
  const { toast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.getAvailableCoupons()
      setCoupons(res.data)
    } catch {
      toast('Failed to load coupons', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const dangerouslyExpired = (coupon: Coupon) => {
    if (!coupon.expiry_date) return false
    return new Date(coupon.expiry_date).getTime() < Date.now()
  }

  return (
    <div className="container-shopx mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/account" className="hover:text-brand-600">Account</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-900">Coupons</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Available Coupons</h1>
        <p className="mt-1 text-sm text-ink-500">Copy a code and apply it at checkout to save on your order</p>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Spinner /></div>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={<IconTag className="h-12 w-12" />}
          title="No coupons available"
          description="Check back later for new promotions and discount codes"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coupons.map((coupon) => {
            const expired = dangerouslyExpired(coupon)
            return (
              <div
                key={coupon.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-card transition-all hover:shadow-cardHover ${
                  expired ? 'border-ink-100 opacity-60' : 'border-ink-100'
                }`}
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-brand-600" />
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-extrabold tracking-wider text-brand-600">{coupon.code}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {coupon.type === 'percent' ? `${coupon.value}% off` : `${formatPrice(coupon.value)} off`}
                      {coupon.min_order_amount > 0 && ` • min ${formatPrice(coupon.min_order_amount)}`}
                    </p>
                  </div>
                  {expired && <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-500">Expired</span>}
                </div>

                {coupon.description && <p className="text-sm text-ink-600">{coupon.description}</p>}

                {coupon.max_discount_amount && coupon.max_discount_amount > 0 && (
                  <p className="mt-1 text-xs text-ink-400">
                    Max discount: {formatPrice(coupon.max_discount_amount)}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink-200 pt-3">
                  <span className="text-xs text-ink-400">
                    {coupon.expiry_date ? `Valid till ${formatDate(coupon.expiry_date)}` : 'No expiry'}
                  </span>
                  <CopyButton text={coupon.code}>
                    <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors">
                      Copy Code
                    </span>
                  </CopyButton>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}