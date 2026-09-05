import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '@/types'
import { Price, DiscountBadge } from '@/components/ui/Price'
import { RatingPill } from '@/components/ui/Rating'
import { IconHeart, IconHeartFilled } from '@/components/ui/icons'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import { ButtonSpinner } from '@/components/ui/Spinner'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export default function ProductCard({ product, priority }: ProductCardProps) {
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { isInWishlist, addItem: addWish, removeItem: removeWish } = useWishlist()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [adding, setAdding] = useState(false)

  const inWishlist = isInWishlist(product.id)
  const outOfStock = product.stock <= 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast('Please log in to add items to your cart', 'info')
      navigate('/login')
      return
    }
    setAdding(true)
    try {
      await addItem(product.id, null, 1)
      toast('Added to cart')
    } catch (err: any) {
      toast(err.message || 'Failed to add to cart', 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast('Please log in first', 'info')
      navigate('/login')
      return
    }
    try {
      if (inWishlist) {
        await removeWish(product.id)
        toast('Removed from wishlist')
      } else {
        await addWish(product.id)
        toast('Added to wishlist')
      }
    } catch (err: any) {
      toast(err.message || 'Something went wrong', 'error')
    }
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-100">
        {!imgLoaded && <div className="absolute inset-0 skeleton" />}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-300">
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
            </svg>
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.discount_percent > 0 && <DiscountBadge discount={product.discount_percent} />}
          {product.is_new > 0 && <span className="badge bg-brand-600 text-white">NEW</span>}
        </div>

        <button
          onClick={handleWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-110"
        >
          {inWishlist ? <IconHeartFilled className="h-4.5 w-4.5 text-red-500" /> : <IconHeart className="h-[18px] w-[18px] text-ink-500" />}
        </button>

        {outOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-ink-900/80 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Out of stock
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            className="w-full rounded-xl bg-ink-900/90 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {adding ? <ButtonSpinner /> : outOfStock ? 'Out of stock' : 'Add to Cart'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          {product.brand_name && <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-ink-400">{product.brand_name}</span>}
          {product.rating_avg > 0 && <RatingPill rating={product.rating_avg} />}
        </div>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink-800">{product.name}</h3>
        <Price price={product.price} compareAt={product.compare_at_price} size="md" />
        <span className="text-xs text-ink-400">{product.sold_count > 0 ? `${product.sold_count}+ bought` : 'New arrival'}</span>
      </div>
    </Link>
  )
}