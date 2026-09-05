export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' }
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-ink-200 border-t-brand-600`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function ButtonSpinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
}