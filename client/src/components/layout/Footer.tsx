import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBag, IconCheck } from '@/components/ui/icons'
import { api } from '@/api/client'
import { useToast } from '@/context/ToastContext'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const { toast } = useToast()

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.subscribeNewsletter(email)
      setSubscribed(true)
      toast('Subscribed successfully!')
    } catch (err: any) {
      toast(err.message || 'Could not subscribe', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-900 text-ink-300">
      {/* Newsletter */}
      <div className="border-b border-ink-800">
        <div className="container-shopx flex flex-col items-center gap-6 py-12 text-center">
          <div>
            <h3 className="text-2xl font-extrabold text-white">Stay in the loop</h3>
            <p className="mt-1.5 text-sm text-ink-400">Subscribe for exclusive deals, new arrivals and members-only offers.</p>
          </div>
          {subscribed ? (
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-400">
              <IconCheck className="h-5 w-5" /> You're subscribed! Watch your inbox for offers.
            </div>
          ) : (
            <form onSubmit={subscribe} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 rounded-full border border-ink-700 bg-ink-800 px-5 py-3 text-sm text-white placeholder-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button className="btn-accent rounded-full" disabled={loading}>
                {loading ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="container-shopx grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <IconBag className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold text-white">Shop<span className="text-brand-400">X</span></span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
            India's premium online shopping destination. Shop the latest electronics, fashion, home essentials and more — all at unbeatable prices.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs text-ink-500">
            <span className="rounded-md border border-ink-700 bg-ink-800 px-2 py-1">UPI</span>
            <span className="rounded-md border border-ink-700 bg-ink-800 px-2 py-1">Visa</span>
            <span className="rounded-md border border-ink-700 bg-ink-800 px-2 py-1">MC</span>
            <span className="rounded-md border border-ink-700 bg-ink-800 px-2 py-1">NetBanking</span>
            <span className="rounded-md border border-ink-700 bg-ink-800 px-2 py-1">COD</span>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/products" className="hover:text-white">All Products</Link></li>
            <li><Link to="/products?category=electronics" className="hover:text-white">Electronics</Link></li>
            <li><Link to="/products?category=fashion" className="hover:text-white">Fashion</Link></li>
            <li><Link to="/products?category=home-furniture" className="hover:text-white">Home & Furniture</Link></li>
            <li><Link to="/products?sort=newest" className="hover:text-white">New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Account</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/account" className="hover:text-white">My Account</Link></li>
            <li><Link to="/account/orders" className="hover:text-white">My Orders</Link></li>
            <li><Link to="/account/wishlist" className="hover:text-white">Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
            <li><Link to="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Support</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-white">Help Center</a></li>
            <li><a href="#" className="hover:text-white">Track Order</a></li>
            <li><a href="#" className="hover:text-white">Returns & Refunds</a></li>
            <li><a href="#" className="hover:text-white">Shipping Policy</a></li>
            <li><a href="#" className="hover:text-white">Contact Us</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="container-shopx flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} ShopX. All rights reserved.</p>
          <p className="flex items-center gap-4">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Refund Policy</a>
          </p>
        </div>
      </div>
    </footer>
  )
}