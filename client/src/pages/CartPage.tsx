import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { formatPrice } from '@/lib/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Price } from '@/components/ui/Price'
import type { CartItem } from '@/types'
import {
  IconBag,
  IconCart,
  IconCheckCircle,
  IconChevronRight,
  IconMinus,
  IconPlus,
  IconTag,
  IconTrash,
  IconX,
} from '@/components/ui/icons'

const FREE_DELIVERY_THRESHOLD = 999
const TAX_RATE_LABEL = '5%'

export default function CartPage() {
  const { isAuthenticated } = useAuth()
  const {
    cart,
    loading,
    updateQuantity,
    removeItem,
    toggleSaveForLater,
    applyCoupon,
    removeCoupon,
  } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [couponCode, setCouponCode] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)

  const setBusyKey = (key: string, value: boolean) => setBusy((b) => ({ ...b, [key]: value }))

  const changeQty = async (item: CartItem, delta: number) => {
    const next = item.quantity + delta
    if (next < 1 || next > item.stock) return
    const key = `qty-${item.id}`
    setBusyKey(key, true)
    try {
      await updateQuantity(item.id, next)
      toast('Cart updated')
    } catch (err: any) {
      toast(err.message || 'Could not update quantity', 'error')
    } finally {
      setBusyKey(key, false)
    }
  }

  const handleRemove = async (item: CartItem) => {
    const key = `remove-${item.id}`
    setBusyKey(key, true)
    try {
      await removeItem(item.id)
      toast('Item removed from cart')
    } catch (err: any) {
      toast(err.message || 'Could not remove item', 'error')
    } finally {
      setBusyKey(key, false)
    }
  }

  const handleSave = async (item: CartItem, toCart = false) => {
    const key = `save-${item.id}`
    setBusyKey(key, true)
    try {
      await toggleSaveForLater(item.id)
      toast(toCart ? 'Moved to cart' : 'Saved for later')
    } catch (err: any) {
      toast(err.message || 'Could not update item', 'error')
    } finally {
      setBusyKey(key, false)
    }
  }

  const submitCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponBusy(true)
    try {
      const data = await applyCoupon(code)
      toast(data.coupon ? `Coupon ${data.coupon.code} applied!` : 'Coupon applied')
      setCouponCode('')
    } catch (err: any) {
      toast(err.message || 'Invalid coupon code', 'error')
    } finally {
      setCouponBusy(false)
    }
  }

  const handleRemoveCoupon = async () => {
    setCouponBusy(true)
    try {
      await removeCoupon()
      toast('Coupon removed')
    } catch (err: any) {
      toast(err.message || 'Could not remove coupon', 'error')
    } finally {
      setCouponBusy(false)
    }
  }

  if (loading && !cart) {
    return (
      <div className="container-shopx py-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-ink-200/70 bg-white p-4">
                <div className="skeleton h-24 w-24 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container-shopx py-12">
        <EmptyState
          icon={<IconBag className="h-12 w-12" />}
          title="Please log in to view your cart"
          description="Your cart is stored securely on your account. Log in to see your saved items and checkout."
          action={<Link to="/login" className="btn-primary">Login</Link>}
        />
      </div>
    )
  }

  if (!cart || (cart.items.length === 0 && cart.saved_items.length === 0)) {
    return (
      <div className="container-shopx py-12">
        <EmptyState
          icon={<IconBag className="h-12 w-12" />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore our products and find something you love!"
          action={<Link to="/products" className="btn-primary">Start shopping</Link>}
        />
      </div>
    )
  }

  const deliveryFree = cart.delivery_fee <= 0 || cart.subtotal >= FREE_DELIVERY_THRESHOLD
  const savings = cart.coupon_discount

  return (
    <div className="container-shopx py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">Shopping Cart</h1>
        <span className="text-sm text-ink-500">{cart.item_count} item{cart.item_count === 1 ? '' : 's'}</span>
      </div>

      <div className="mt-6 gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Items */}
        <div>
          {cart.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-300 bg-white px-6 py-14 text-center">
              <IconCart className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-3 text-sm font-semibold text-ink-900">No active items in your cart</p>
              <p className="mt-1 text-xs text-ink-500">Items saved for later are below.</p>
              <Link to="/products" className="btn-primary mt-4">Continue shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="card p-4">
                  <div className="flex gap-4">
                    <Link to={`/product/${item.slug}`} className="shrink-0">
                      <img
                        src={item.image || ''}
                        alt={item.name}
                        loading="lazy"
                        className="h-24 w-24 rounded-xl border border-ink-100 bg-ink-100 object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium text-ink-800 hover:text-brand-600">
                        {item.name}
                      </Link>
                      {(item.variant_name || item.color || item.size) && (
                        <p className="mt-0.5 text-xs text-ink-500">
                          {[item.variant_name, item.color, item.size].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <div className="mt-1.5">
                        <Price price={item.line_price} compareAt={item.compare_at_price} size="sm" />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="flex items-center rounded-xl border border-ink-200 bg-white">
                          <button
                            onClick={() => changeQty(item, -1)}
                            disabled={busy[`qty-${item.id}`] || item.quantity <= 1}
                            className="flex h-8 w-8 items-center justify-center text-ink-500 transition-colors hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <IconMinus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-bold text-ink-900">
                            {busy[`qty-${item.id}`] ? '…' : item.quantity}
                          </span>
                          <button
                            onClick={() => changeQty(item, 1)}
                            disabled={busy[`qty-${item.id}`] || item.quantity >= item.stock}
                            className="flex h-8 w-8 items-center justify-center text-ink-500 transition-colors hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <IconPlus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleSave(item)}
                          disabled={busy[`save-${item.id}`]}
                          className="text-xs font-semibold text-brand-600 hover:underline"
                        >
                          Save for later
                        </button>
                        <button
                          onClick={() => handleRemove(item)}
                          disabled={busy[`remove-${item.id}`]}
                          className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
                        >
                          {busy[`remove-${item.id}`] ? <Spinner size="sm" /> : <IconTrash className="h-3.5 w-3.5" />} Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink-900">{formatPrice(item.line_price * item.quantity)}</p>
                      {item.quantity > 1 && <p className="mt-0.5 text-xs text-ink-400">{formatPrice(item.line_price)} each</p>}
                      {item.quantity >= item.stock && <p className="mt-1 text-[11px] font-semibold text-amber-600">Max stock</p>}
                    </div>
                  </div>
                  {item.quantity >= item.stock && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700">
                      You've reached the maximum available stock ({item.stock}) for this item.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Saved for later */}
          {cart.saved_items.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink-900">Saved for later ({cart.saved_items.length})</h2>
              <div className="mt-4 space-y-3">
                {cart.saved_items.map((item) => (
                  <div key={item.id} className="card flex items-center gap-4 p-4">
                    <Link to={`/product/${item.slug}`} className="shrink-0">
                      <img src={item.image || ''} alt={item.name} loading="lazy" className="h-20 w-20 rounded-xl border border-ink-100 bg-ink-100 object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${item.slug}`} className="line-clamp-1 text-sm font-medium text-ink-800 hover:text-brand-600">
                        {item.name}
                      </Link>
                      {(item.variant_name || item.color || item.size) && (
                        <p className="mt-0.5 text-xs text-ink-500">
                          {[item.variant_name, item.color, item.size].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm font-bold text-ink-900">{formatPrice(item.line_price * item.quantity)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => handleSave(item, true)} disabled={busy[`save-${item.id}`]} className="btn-outline px-3 py-2 text-xs">
                        {busy[`save-${item.id}`] ? <Spinner size="sm" /> : 'Move to cart'}
                      </button>
                      <button
                        onClick={() => handleRemove(item)}
                        disabled={busy[`remove-${item.id}`]}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 text-ink-500 transition-colors hover:border-red-200 hover:text-red-500"
                        aria-label="Remove saved item"
                      >
                        {busy[`remove-${item.id}`] ? <Spinner size="sm" /> : <IconTrash className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-ink-200/70 bg-white p-4">
            <p className="text-sm font-bold text-ink-900">Coupon</p>
            {cart.coupon ? (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3">
                <div className="flex items-center gap-2.5">
                  <IconCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700">{cart.coupon.code}</p>
                    <p className="text-xs text-emerald-600">You saved {formatPrice(cart.coupon_discount)}</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  disabled={couponBusy}
                  className="rounded-full p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100"
                  aria-label="Remove coupon"
                >
                  {couponBusy ? <Spinner size="sm" /> : <IconX className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <form onSubmit={submitCoupon} className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <IconTag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="input pl-9 uppercase"
                  />
                </div>
                <button type="submit" disabled={couponBusy || !couponCode.trim()} className="btn-outline shrink-0 px-4">
                  {couponBusy ? <Spinner size="sm" /> : 'Apply'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-ink-200/70 bg-white p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400">Price details</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-semibold text-ink-900">{formatPrice(cart.subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Coupon discount</span>
                  <span className="font-semibold text-emerald-600">− {formatPrice(savings)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Delivery fee</span>
                {deliveryFree ? (
                  <span className="font-semibold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-semibold text-ink-900">{formatPrice(cart.delivery_fee)}</span>
                )}
              </div>
              {!deliveryFree && cart.subtotal < FREE_DELIVERY_THRESHOLD && (
                <p className="text-xs text-ink-400">
                  Add {formatPrice(FREE_DELIVERY_THRESHOLD - cart.subtotal)} more to get free delivery
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Tax ({TAX_RATE_LABEL})</span>
                <span className="font-semibold text-ink-900">{formatPrice(cart.tax)}</span>
              </div>
              <div className="border-t border-dashed border-ink-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-ink-900">Total</span>
                  <span className="text-xl font-extrabold text-ink-900">{formatPrice(cart.total)}</span>
                </div>
                {savings > 0 && <p className="mt-1 text-right text-xs font-medium text-emerald-600">You save {formatPrice(savings)} on this order</p>}
              </div>
            </div>
            <button onClick={() => navigate('/checkout')} disabled={cart.items.length === 0} className="btn-accent mt-5 w-full py-3">
              <IconChevronRight className="h-4 w-4" /> Proceed to Checkout
            </button>
            <Link to="/products" className="mt-3 block text-center text-xs font-semibold text-brand-600 hover:underline">
              Continue shopping
            </Link>
            <p className="mt-2 text-center text-[11px] text-ink-400">Secure payment · 7-day returns · COD available</p>
          </div>
        </div>
      </div>
    </div>
  )
}