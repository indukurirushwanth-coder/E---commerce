import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { Product, Review, Variant } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import ProductCard from '@/components/product/ProductCard'
import { ProductGridSkeleton } from '@/components/product/ProductSkeleton'
import { Spinner, ButtonSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { RatingStars } from '@/components/ui/Rating'
import { Price, DiscountBadge } from '@/components/ui/Price'
import { formatDate, timeAgo, initials } from '@/lib/format'
import {
  IconCart,
  IconCheck,
  IconCheckCircle,
  IconChevronRight,
  IconHeart,
  IconHeartFilled,
  IconMapPin,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconShare,
  IconShield,
  IconStar,
  IconTruck,
} from '@/components/ui/icons'

const FREE_DELIVERY_THRESHOLD = 999

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { isInWishlist, addItem: addWish, removeItem: removeWish } = useWishlist()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeImg, setActiveImg] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [related, setRelated] = useState<Product[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)

  const [canWriteReview, setCanWriteReview] = useState<{ can_review: boolean; order_item_id?: number | null }>({ can_review: false })
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const [pin, setPin] = useState('')
  const [pinChecking, setPinChecking] = useState(false)
  const [pinResult, setPinResult] = useState<{ available: boolean; eta_days?: number; cod_available?: boolean; estimated_delivery?: string; message?: string } | null>(null)

  const [helpfulCounts, setHelpfulCounts] = useState<Record<number, number>>({})
  const [helpfulMarked, setHelpfulMarked] = useState<Record<number, boolean>>({})

  const [addingToCart, setAddingToCart] = useState(false)
  const [wishlistBusy, setWishlistBusy] = useState(false)

  const loadReviews = useCallback(async (p: Product) => {
    setReviewsLoading(true)
    try {
      const res = await api.getProductReviews(p.id)
      setReviews(res.data)
      const counts: Record<number, number> = {}
      res.data.forEach((r) => { counts[r.id] = r.helpful_count })
      setHelpfulCounts(counts)
    } catch {
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  const loadRelated = useCallback(async (p: Product) => {
    setRelatedLoading(true)
    try {
      const res = await api.getProducts({ category: p.category_slug, perPage: 8 })
      setRelated(res.data.filter((x) => x.slug !== p.slug))
    } catch {
      setRelated([])
    } finally {
      setRelatedLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setProduct(null)
    setReviews([])
    setRelated([])
    setActiveImg(0)
    setSelectedColor(null)
    setSelectedSize(null)
    setQuantity(1)
    setPinResult(null)
    setHelpfulCounts({})
    setHelpfulMarked({})
    setCanWriteReview({ can_review: false })
    window.scrollTo(0, 0)

    api
      .getProduct(slug)
      .then((res) => {
        setProduct(res.data)
        loadReviews(res.data)
        loadRelated(res.data)
        if (isAuthenticated) {
          api.canReview(res.data.id).then((r) => setCanWriteReview(r.data)).catch(() => {})
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [slug, isAuthenticated, loadReviews, loadRelated])

  const images = useMemo(() => {
    if (product?.images && product.images.length > 0) return product.images
    if (product?.image) return [{ url: product.image }]
    return []
  }, [product])

  const colors = useMemo(
    () => Array.from(new Set((product?.variants || []).map((v) => v.color).filter(Boolean) as string[])),
    [product],
  )
  const sizes = useMemo(
    () => Array.from(new Set((product?.variants || []).map((v) => v.size).filter(Boolean) as string[])),
    [product],
  )

  const activeVariant = useMemo<Variant | null>(() => {
    const vs = product?.variants || []
    if (vs.length === 0) return null
    if (selectedColor && selectedSize) return vs.find((v) => v.color === selectedColor && v.size === selectedSize) || null
    if (selectedColor) return vs.find((v) => v.color === selectedColor) || null
    if (selectedSize) return vs.find((v) => v.size === selectedSize) || null
    return vs[0]
  }, [product, selectedColor, selectedSize])

  useEffect(() => {
    setQuantity(1)
  }, [activeVariant?.id])

  const displayPrice = activeVariant?.price ?? product?.price ?? 0
  const displayCompare = activeVariant?.compare_at_price ?? product?.compare_at_price
  const displayStock = activeVariant?.stock ?? product?.stock ?? 0
  const displayImage = activeVariant?.image || images[activeImg]?.url || product?.image || ''
  const discount = useMemo(() => {
    if (displayCompare && displayCompare > displayPrice) {
      return Math.round(((displayCompare - displayPrice) / displayCompare) * 100)
    }
    return product?.discount_percent ?? 0
  }, [displayCompare, displayPrice, product])

  const inWishlist = product ? isInWishlist(product.id) : false

  const handleAddToCart = async () => {
    if (!product) return
    if (!isAuthenticated) {
      toast('Please log in to add items to your cart', 'info')
      navigate('/login')
      return
    }
    if (displayStock <= 0) return
    setAddingToCart(true)
    try {
      await addItem(product.id, activeVariant?.id ?? undefined, quantity)
      toast('Added to cart')
    } catch (err: any) {
      toast(err.message || 'Failed to add to cart', 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleWishlist = async () => {
    if (!product) return
    if (!isAuthenticated) {
      toast('Please log in first', 'info')
      navigate('/login')
      return
    }
    setWishlistBusy(true)
    try {
      if (inWishlist) {
        await removeWish(product.id)
        toast('Removed from wishlist')
      } else {
        await addWish(product.id, activeVariant?.id ?? null)
        toast('Added to wishlist')
      }
    } catch (err: any) {
      toast(err.message || 'Something went wrong', 'error')
    } finally {
      setWishlistBusy(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast('Link copied to clipboard')
    } catch {
      toast('Could not copy link', 'error')
    }
  }

  const checkPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[0-9]{6}$/.test(pin)) {
      toast('Enter a valid 6-digit PIN code', 'error')
      return
    }
    setPinChecking(true)
    try {
      const res = await api.validatePin(pin)
      setPinResult(res)
      if (!res.available) toast(res.message || 'Delivery is not available to this PIN code', 'error')
    } catch (err: any) {
      toast(err.message || 'Could not check the PIN code', 'error')
    } finally {
      setPinChecking(false)
    }
  }

  const handleHelpful = async (id: number) => {
    if (helpfulMarked[id]) return
    setHelpfulMarked((m) => ({ ...m, [id]: true }))
    setHelpfulCounts((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
    try {
      const res = await api.markReviewHelpful(id, true)
      setHelpfulCounts((c) => ({ ...c, [id]: res.data.helpful_count }))
    } catch {
      // keep the optimistic count
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    if (reviewRating < 1) {
      toast('Please select a rating', 'error')
      return
    }
    setReviewSubmitting(true)
    try {
      await api.createReview({
        product_id: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        body: reviewBody.trim() || undefined,
        order_item_id: canWriteReview.order_item_id ?? null,
      })
      toast('Thanks! Your review has been posted.')
      setReviewRating(0)
      setReviewTitle('')
      setReviewBody('')
      setCanWriteReview({ can_review: false })
      loadReviews(product)
    } catch (err: any) {
      toast(err.message || 'Could not submit the review', 'error')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container-shopx py-6">
        <div className="skeleton h-5 w-64 rounded" />
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="skeleton aspect-square rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-9 w-4/5 rounded" />
            <div className="skeleton h-7 w-48 rounded" />
            <div className="skeleton h-4 w-64 rounded" />
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-24 w-full rounded-2xl" />
          </div>
        </div>
        <div className="mt-14">
          <div className="skeleton mb-4 h-8 w-52 rounded" />
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-shopx py-12">
        <EmptyState
          title="Product not found"
          description="The product you are looking for does not exist or has been removed."
          action={<Link to="/products" className="btn-primary">Browse products</Link>}
        />
      </div>
    )
  }

  return (
    <div className="container-shopx py-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <IconChevronRight className="h-3.5 w-3.5 text-ink-300" />
        <Link to={`/products?category=${product.category_slug}`} className="hover:text-brand-600">{product.category_name || 'Products'}</Link>
        <IconChevronRight className="h-3.5 w-3.5 text-ink-300" />
        <span className="line-clamp-1 font-medium text-ink-800">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-ink-200/70 bg-white">
            <div className="relative aspect-square bg-ink-100">
              {displayImage ? (
                <img src={displayImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-300">
                  <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
                {discount > 0 && <DiscountBadge discount={discount} />}
                {product.is_new > 0 && <span className="badge bg-brand-600 text-white">NEW</span>}
                {product.is_best_seller > 0 && <span className="badge bg-accent-500 text-white">BESTSELLER</span>}
              </div>
            </div>
          </div>
          {images.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === activeImg && !activeVariant?.image ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-ink-200 hover:border-brand-400'}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand_name && (
            <Link to={`/products?brand=${product.brand_name}`} className="text-xs font-bold uppercase tracking-wider text-brand-600 hover:underline">
              {product.brand_name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-500">
            <span className="flex items-center gap-1.5">
              <RatingStars rating={product.rating_avg} size="sm" />
              <span className="font-semibold text-ink-700">{product.rating_avg > 0 ? product.rating_avg.toFixed(1) : 'No ratings'}</span>
              <span>({product.rating_count})</span>
            </span>
            <span>{product.reviews_count} reviews</span>
            <span>{product.sold_count > 0 ? `${product.sold_count}+ bought` : 'New arrival'}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price price={displayPrice} compareAt={displayCompare} size="lg" />
            <span className="rounded-lg bg-accent-500/10 px-2 py-1 text-xs font-bold text-accent-600">{discount}% OFF</span>
          </div>
          {product.tags && (
            <p className="mt-1.5 text-xs text-ink-500">
              Tags: {product.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t, i) => <span key={t} className="mr-1.5 inline-block rounded-full bg-ink-100 px-2 py-0.5 text-ink-600">{t}</span>)}
            </p>
          )}

          {/* Variants */}
          {colors.length > 0 && (
            <div className="mt-6">
              <p className="label">Color <span className="ml-1 font-normal normal-case text-ink-400">— {selectedColor || 'Select'}</span></p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(selectedColor === c ? null : c)}
                    className={`rounded-full border-2 px-4 py-1.5 text-xs font-semibold transition-all ${selectedColor === c ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-400'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {sizes.length > 0 && (
            <div className="mt-4">
              <p className="label">Size <span className="ml-1 font-normal normal-case text-ink-400">— {selectedSize || 'Select'}</span></p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                    className={`rounded-xl border-2 px-4 py-1.5 text-xs font-bold transition-all ${selectedSize === s ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-400'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="mt-6">
            {displayStock > 0 ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <IconCheckCircle className="h-4 w-4" /> In stock
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-red-500">Out of stock</p>
            )}
            {displayStock > 0 && displayStock <= 5 && <p className="mt-0.5 text-sm font-semibold text-amber-600">Only {displayStock} left — order soon!</p>}
          </div>

          {/* Quantity + actions */}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-xl border border-ink-200 bg-white">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-11 w-11 items-center justify-center text-ink-500 transition-colors hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <IconMinus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-bold text-ink-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
                disabled={quantity >= displayStock}
                className="flex h-11 w-11 items-center justify-center text-ink-500 transition-colors hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleShare}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              <IconShare className="h-4 w-4" /> Share
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || displayStock <= 0}
              className="btn-primary flex-1 py-3"
            >
              {addingToCart ? <ButtonSpinner /> : <><IconCart className="h-5 w-5" /> Add to Cart</>}
            </button>
            <button
              onClick={handleWishlist}
              disabled={wishlistBusy}
              className={`btn-outline flex-1 py-3 ${inWishlist ? 'border-red-200 text-red-500 hover:border-red-300 hover:text-red-600' : ''}`}
            >
              {wishlistBusy ? <Spinner size="sm" /> : inWishlist ? <><IconHeartFilled className="h-5 w-5 text-red-500" /> In Wishlist</> : <><IconHeart className="h-5 w-5" /> Add to Wishlist</>}
            </button>
          </div>

          {/* Delivery checker */}
          <div className="mt-5 rounded-2xl border border-ink-200/70 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <IconMapPin className="h-4.5 w-4.5 text-brand-600" /> Check delivery availability
            </p>
            <form onSubmit={checkPin} className="mt-3 flex gap-2">
              <input
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinResult(null) }}
                placeholder="Enter 6-digit PIN code"
                inputMode="numeric"
                className="input"
              />
              <button type="submit" disabled={pinChecking || pin.length !== 6} className="btn-primary shrink-0 px-4">
                {pinChecking ? <Spinner size="sm" /> : 'Check'}
              </button>
            </form>
            {pinResult?.available ? (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <IconTruck className="h-4 w-4" /> Delivery available to {pin}
                </p>
                {pinResult.estimated_delivery && (
                  <p className="mt-1 flex items-center gap-1.5 text-emerald-600">Delivered by {formatDate(pinResult.estimated_delivery)}</p>
                )}
                <p className="mt-1 text-emerald-600">Cash on Delivery: {pinResult.cod_available ? 'Available' : 'Not available'}</p>
              </div>
            ) : pinResult ? (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{pinResult.message || 'Delivery is not available to this PIN code.'}</p>
            ) : null}
          </div>

          {/* USP strip */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: <IconTruck className="h-5 w-5" />, text: `Free delivery above ₹${FREE_DELIVERY_THRESHOLD}` },
              { icon: <IconRefresh className="h-5 w-5" />, text: '7-day easy returns' },
              { icon: <IconShield className="h-5 w-5" />, text: 'Secure payments' },
              { icon: <IconCheck className="h-5 w-5" />, text: 'COD available' },
            ].map((u) => (
              <div key={u.text} className="flex items-center gap-2 rounded-xl bg-ink-50 p-2.5">
                <span className="text-brand-600">{u.icon}</span>
                <span className="text-[11px] font-medium leading-tight text-ink-600">{u.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">Product Description</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600">{product.description || 'No description available for this product.'}</p>
      </section>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <section className="card mt-10 p-6">
          <h2 className="text-lg font-bold text-ink-900">Specifications</h2>
          <table className="mt-4 w-full">
            <tbody>
              {Object.entries(product.specifications).map(([k, v]) => (
                <tr key={k} className="border-b border-ink-100 last:border-0">
                  <td className="w-1/3 py-2.5 pr-4 align-top text-sm font-semibold text-ink-600">{k}</td>
                  <td className="break-words py-2.5 text-sm text-ink-800">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">Customer Reviews</h2>
            <p className="mt-1 text-sm text-ink-500">{reviews.length} reviews · {product.rating_count} total ratings</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-ink-900">
            <IconStar className="h-4 w-4 text-amber-400" /> {product.rating_avg > 0 ? product.rating_avg.toFixed(1) : '—'} / 5
          </span>
        </div>

        {canWriteReview.can_review && (
          <div className="card mt-6 p-5">
            <h3 className="text-base font-bold text-ink-900">Write a review</h3>
            <form onSubmit={submitReview} className="mt-3 space-y-4">
              <div>
                <p className="label">Your rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i)}
                      aria-label={`${i} star${i > 1 ? 's' : ''}`}
                      className="transition-transform hover:scale-110"
                    >
                      <IconStar className={`h-7 w-7 ${i <= reviewRating ? 'text-amber-400' : 'text-ink-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label">Title</p>
                <input
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Short summary of your experience"
                  maxLength={120}
                  className="input"
                />
              </div>
              <div>
                <p className="label">Review</p>
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share details of your experience — what you liked, delivery, quality…"
                  rows={4}
                  className="input resize-none"
                />
              </div>
              <button type="submit" disabled={reviewSubmitting} className="btn-primary">
                {reviewSubmitting ? <ButtonSpinner /> : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {reviewsLoading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-300 bg-white px-6 py-12 text-center">
              <p className="text-sm text-ink-500">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {r.avatar ? <img src={r.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : initials(r.full_name || 'ShopX User')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-ink-900">{r.full_name || 'ShopX User'}</p>
                      {r.is_verified === 1 && (
                        <span className="badge bg-emerald-100 text-emerald-700"><IconCheck className="h-3 w-3" /> Verified buyer</span>
                      )}
                      <span className="ml-auto text-xs text-ink-400">{timeAgo(r.created_at)}</span>
                    </div>
                    <div className="mt-0.5"><RatingStars rating={r.rating} size="sm" /></div>
                    {r.title && <p className="mt-2 text-sm font-bold text-ink-900">{r.title}</p>}
                    {r.body && <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-ink-600">{r.body}</p>}
                    <button
                      onClick={() => handleHelpful(r.id)}
                      disabled={!!helpfulMarked[r.id]}
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${helpfulMarked[r.id] ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-600'}`}
                    >
                      <IconCheck className="h-3.5 w-3.5" /> Helpful ({helpfulCounts[r.id] ?? r.helpful_count})
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related products */}
      <section className="mt-14">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">You may also like</h2>
            <p className="mt-1 text-sm text-ink-500">More from {product.category_name || 'this category'}</p>
          </div>
          <Link to={`/products?category=${product.category_slug}`} className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:underline sm:flex">
            View all <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {relatedLoading ? (
          <ProductGridSkeleton count={4} />
        ) : related.length === 0 ? null : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}