import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import type { WishlistItem } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner, ButtonSpinner } from '@/components/ui/Spinner'
import { IconChevronRight, IconHeart, IconTrash, IconCart } from '@/components/ui/icons'
import { formatPrice } from '@/lib/format'

export default function WishlistPage() {
  const { items, loading, removeItem, moveToCart } = useWishlist()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<number | null>(null)

  const handleRemove = async (item: WishlistItem) => {
    setBusyId(item.product_id)
    try {
      await removeItem(item.product_id)
      toast('Removed from wishlist')
    } catch (err: any) {
      toast(err.message || 'Failed to remove', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleMoveToCart = async (item: WishlistItem) => {
    setBusyId(item.product_id)
    try {
      await moveToCart(item.product_id)
      toast('Moved to cart')
    } catch (err: any) {
      toast(err.message || 'Failed to move to cart', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container-shopx mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/account" className="hover:text-brand-600">Account</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-900">Wishlist</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">My Wishlist</h1>
          <p className="mt-1 text-sm text-ink-500">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconHeart className="h-12 w-12" />}
          title="Your wishlist is empty"
          description="Save items you love and find them here anytime"
          action={
            <Link to="/products" className="btn-primary text-sm">Browse Products</Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-cardHover"
            >
              <Link to={`/product/${item.slug}`} className="relative block aspect-square overflow-hidden bg-ink-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-300">
                    <IconHeart className="h-10 w-10" />
                  </div>
                )}
                {item.stock <= 0 && (
                  <div className="absolute inset-x-0 bottom-0 bg-ink-900/80 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white">
                    Out of stock
                  </div>
                )}
              </Link>
              <div className="p-4">
                <Link to={`/product/${item.slug}`}>
                  <h3 className="line-clamp-1 text-sm font-medium text-ink-900 hover:text-brand-600">{item.name}</h3>
                </Link>
                {item.variant_name && <p className="mt-0.5 text-xs text-ink-500">{item.variant_name}</p>}
                <p className="mt-1.5 text-sm font-bold text-ink-900">{formatPrice(item.price)}</p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    disabled={item.stock <= 0 || busyId === item.product_id}
                    className="btn-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs disabled:opacity-50"
                  >
                    {busyId === item.product_id ? <ButtonSpinner /> : <IconCart className="h-4 w-4" />}
                    Move to Cart
                  </button>
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={busyId === item.product_id}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink-200 text-danger hover:bg-red-50 disabled:opacity-50"
                    aria-label="Remove from wishlist"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}