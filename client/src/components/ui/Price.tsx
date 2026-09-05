import { formatPrice } from '@/lib/format'

interface PriceProps {
  price: number
  compareAt?: number | null
  discount?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: { price: 'text-sm', compare: 'text-xs' },
  md: { price: 'text-base', compare: 'text-xs' },
  lg: { price: 'text-lg', compare: 'text-sm' },
  xl: { price: 'text-2xl', compare: 'text-sm' },
}

export function Price({ price, compareAt, discount, size = 'md' }: PriceProps) {
  const s = sizes[size]
  const showDiscount = discount && discount > 0
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-bold text-ink-900 ${s.price}`}>{formatPrice(price)}</span>
      {compareAt && compareAt > price && (
        <span className={`font-medium text-ink-400 line-through ${s.compare}`}>{formatPrice(compareAt)}</span>
      )}
      {showDiscount && (
        <span className={`font-semibold text-emerald-600 ${s.compare}`}>{Math.round(discount!)}% off</span>
      )}
    </div>
  )
}

export function DiscountBadge({ discount }: { discount: number }) {
  if (!discount || discount <= 0) return null
  return <span className="badge bg-accent-500 text-white">{Math.round(discount)}% OFF</span>
}