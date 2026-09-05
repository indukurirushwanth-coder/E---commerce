interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md'
  count?: number
  className?: string
}

export function RatingStars({ rating, size = 'sm', count, className = '' }: RatingStarsProps) {
  const sizeCls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i - 0.25
    const half = !filled && rating >= i - 0.75
    stars.push(
      <svg key={i} className={sizeCls} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'}>
        <defs>
          <linearGradient id={`half${i}-${Math.round(rating * 100)}`}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.958c.3.922-.755 1.688-1.539 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.539-1.118l1.287-3.958a1 1 0 00-.363-1.118L2.06 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.287-3.958z"
          fill={filled ? 'currentColor' : half ? `url(#half${i}-${Math.round(rating * 100)})` : '#e2e8f0'}
          className={filled ? 'text-amber-400' : 'text-ink-200'}
          stroke="#f59e0b"
          strokeWidth="0.5"
        />
      </svg>,
    )
  }
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      <span className="flex items-center text-amber-400">{stars}</span>
      {count !== undefined && <span className="ml-1 text-xs text-ink-400">({count})</span>}
    </span>
  )
}

export function RatingPill({ rating }: { rating: number }) {
  return (
    <span className="badge bg-emerald-100 text-emerald-700">
      {typeof rating === 'number' ? rating.toFixed(1) : 'New'}
      <svg className="h-3 w-3 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.958c.3.922-.755 1.688-1.539 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.539-1.118l1.287-3.958a1 1 0 00-.363-1.118L2.06 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.287-3.958z" />
      </svg>
    </span>
  )
}