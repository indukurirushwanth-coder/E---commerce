import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconChevronRight, IconStar } from '@/components/ui/icons'

export default function MyReviewsPage() {
  return (
    <div className="container-shopx mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/account" className="hover:text-brand-600">Account</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-900">Reviews</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-ink-900">My Reviews</h1>

      <EmptyState
        icon={<IconStar className="h-12 w-12" />}
        title="Write reviews for your purchases"
        description="Your reviews help other shoppers make better decisions. Browse products you've bought and share your experience by rating and reviewing them on the product page."
        action={
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link to="/account/orders" className="btn-primary text-sm">
              View My Orders
            </Link>
            <Link to="/products" className="btn-outline text-sm">
              Browse Products
            </Link>
          </div>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <IconStar className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-ink-900">Rate Your Purchase</h3>
          <p className="mt-1 text-xs text-ink-500">Open any delivered order's product page and share your rating.</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <IconStar className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-ink-900">Verified Reviews</h3>
          <p className="mt-1 text-xs text-ink-500">Reviews on purchased items are marked as verified for buyer confidence.</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <IconStar className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-ink-900">Help Others</h3>
          <p className="mt-1 text-xs text-ink-500">Detailed reviews with photos help the community buy with confidence.</p>
        </div>
      </div>
    </div>
  )
}