import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { api } from '@/api/client'
import { IconBag, IconBell, IconCart, IconChart, IconChevronDown, IconChevronRight, IconHeart, IconLogout, IconMapPin, IconMenu, IconSearch, IconUser, IconX } from '@/components/ui/icons'
import type { Product } from '@/types'
import { useToast } from '@/context/ToastContext'

const debounce = (fn: (term: string) => void, ms: number) => {
  let t: ReturnType<typeof setTimeout>
  return (term: string) => {
    clearTimeout(t)
    t = setTimeout(() => fn(term), ms)
  }
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string; children?: Array<{ name: string; slug: string }> }>>([])
  const [query, setQuery] = useState('')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<{ products: Product[]; categories: Array<{ name: string; slug: string }>; brands: Array<{ name: string; slug: string }> }>({ products: [], categories: [], brands: [] })
  const [showCategories, setShowCategories] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api
      .getCategories()
      .then((res) => setCategories(res.data as any))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSuggestOpen(false)
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setShowCategories(false)
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setSuggestOpen(false)
  }, [location.pathname, location.search])

  const debouncedSearch = useRef(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSuggestions({ products: [], categories: [], brands: [] })
        return
      }
      try {
        const res = await api.searchSuggest(term)
        setSuggestions(res.data)
      } catch {
        setSuggestions({ products: [], categories: [], brands: [] })
      }
    }, 250),
  ).current

  const onQueryChange = (v: string) => {
    setQuery(v)
    setSuggestOpen(true)
    debouncedSearch(v)
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSuggestOpen(false)
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const goToSearch = (term: string) => {
    setQuery(term)
    setSuggestOpen(false)
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  const logoutUser = () => {
    logout()
    setAccountOpen(false)
    toast('You have been logged out')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/90 backdrop-blur-lg">
      {/* Top strip */}
      <div className="hidden bg-ink-900 text-white md:block">
        <div className="container-shopx flex h-8 items-center justify-between text-xs">
          <p className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-accent-500" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
            Free delivery on orders above ₹999 | COD available
          </p>
          {!isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-accent-500">Login</Link>
              <Link to="/register" className="rounded-md bg-brand-600 px-3 py-0.5 font-semibold hover:bg-brand-500">Sign up</Link>
            </div>
          ) : (
            <p className="flex items-center gap-1.5">
              <IconUser className="h-3.5 w-3.5" />
              Hi, {user?.full_name.split(' ')[0]}
            </p>
          )}
        </div>
      </div>

      {/* Main bar */}
      <div className="container-shopx flex h-16 items-center gap-3 sm:gap-5">
        <button className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
          <IconMenu className="h-6 w-6" />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <IconBag className="h-5 w-5" />
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight text-ink-900 sm:block">
            Shop<span className="text-brand-600">X</span>
          </span>
        </Link>

        {/* Desktop search */}
        <div ref={searchRef} className="relative hidden flex-1 max-w-xl lg:block">
          <form onSubmit={submitSearch}>
            <div className="relative">
              <IconSearch className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => setSuggestOpen(true)}
                placeholder="Search for products, brands and more…"
                className="w-full rounded-full border border-ink-200 bg-ink-50 py-2.5 pl-11 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </form>
          {suggestOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-banner animate-slide-down">
              {query.trim() && suggestions.products.length === 0 && suggestions.categories.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-ink-500">
                  <p>No suggestions found for “{query}”.</p>
                  <button onClick={submitSearch} className="link-brand mt-2 font-semibold">Search for “{query}”</button>
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto p-2">
                  {suggestions.products.length > 0 && (
                    <>
                      <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Products</p>
                      {suggestions.products.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSuggestOpen(false); navigate(`/product/${p.slug}`) }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-ink-50"
                        >
                          <img src={p.image || ''} alt="" className="h-11 w-11 rounded-lg bg-ink-100 object-cover" loading="lazy" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink-800">{p.name}</span>
                            <span className="block text-xs text-ink-500">₹{p.price.toLocaleString('en-IN')}</span>
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                  {suggestions.categories.length > 0 && (
                    <>
                      <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">Categories</p>
                      {suggestions.categories.map((c) => (
                        <button key={c.slug} onClick={() => { setSuggestOpen(false); goToSearch(c.name) }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">
                          <IconTag2 /> {c.name}
                        </button>
                      ))}
                    </>
                  )}
                  {suggestions.brands.length > 0 && (
                    <>
                      <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">Brands</p>
                      {suggestions.brands.map((b) => (
                        <button key={b.slug} onClick={() => { setSuggestOpen(false); navigate(`/products?brand=${b.slug}`) }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">
                          {b.name}
                        </button>
                      ))}
                    </>
                  )}
                  {suggestions.products.length > 0 && (
                    <button onClick={submitSearch} className="mt-2 w-full rounded-xl border-t border-ink-100 px-3 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50">
                      See all results for “{query}”
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right icons */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link to="/account/notifications" className="hidden rounded-xl p-2 text-ink-600 transition-colors hover:bg-ink-100 sm:flex lg:hidden xl:flex" aria-label="Notifications">
            <IconBell className="h-5.5 w-5.5" />
          </Link>
          <Link to="/account/wishlist" className="relative rounded-xl p-2 text-ink-600 transition-colors hover:bg-ink-100" aria-label="Wishlist">
            <IconHeart className="h-5.5 w-5.5" />
            {isAuthenticated && wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{wishlistCount}</span>
            )}
          </Link>
          <Link to="/cart" className="relative rounded-xl p-2 text-ink-600 transition-colors hover:bg-ink-100" aria-label="Cart">
            <IconCart className="h-5.5 w-5.5" />
            {isAuthenticated && itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{itemCount}</span>
            )}
          </Link>
          <div ref={accountRef} className="relative">
            <button onClick={() => setAccountOpen((o) => !o)} className="flex items-center gap-1 rounded-xl p-2 text-ink-600 transition-colors hover:bg-ink-100" aria-label="Account">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {user ? user.full_name[0] : <IconUser className="h-5 w-5" />}
                </div>
              )}
              <IconChevronDown className="hidden h-4 w-4 sm:block" />
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-200 bg-white py-2 shadow-banner animate-slide-down">
                {isAuthenticated ? (
                  <>
                    <div className="border-b border-ink-100 px-4 py-3">
                      <p className="text-sm font-bold text-ink-900">{user?.full_name}</p>
                      <p className="truncate text-xs text-ink-500">{user?.email}</p>
                    </div>
                    <MenuLink to="/account" label="My Account" icon={<IconUser className="h-4.5 w-4.5" />} onClick={() => setAccountOpen(false)} />
                    <MenuLink to="/account/orders" label="My Orders" icon={<IconBag className="h-4.5 w-4.5" />} onClick={() => setAccountOpen(false)} />
                    <MenuLink to="/account/wishlist" label="My Wishlist" icon={<IconHeart className="h-4.5 w-4.5" />} onClick={() => setAccountOpen(false)} />
                    <MenuLink to="/account/addresses" label="Addresses" icon={<IconMapPin className="h-4.5 w-4.5" />} onClick={() => setAccountOpen(false)} />
                    {user?.role === 'admin' && <MenuLink to="/admin" label="Admin Dashboard" icon={<IconChart className="h-4.5 w-4.5" />} onClick={() => setAccountOpen(false)} />}
                    <button onClick={logoutUser} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <IconLogout className="h-4.5 w-4.5" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-3">
                    <p className="mb-3 text-sm text-ink-500">Log in to access your account</p>
                    <Link to="/login" onClick={() => setAccountOpen(false)} className="btn-primary w-full">Login</Link>
                    <Link to="/register" onClick={() => setAccountOpen(false)} className="btn-outline mt-2 w-full">Create account</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="border-t border-ink-100 px-4 py-2 lg:hidden">
        <form onSubmit={submitSearch}>
          <div className="relative">
            <IconSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setSuggestOpen(true)}
              placeholder="Search products, brands…"
              className="w-full rounded-full border border-ink-200 bg-ink-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </form>
        {suggestOpen && query.trim() && (
          <div className="absolute inset-x-4 top-full z-50 mt-0 max-h-[60vh] overflow-y-auto rounded-2xl border border-ink-200 bg-white shadow-banner animate-slide-down">
            {suggestions.products.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-ink-500">
                No suggestions found. <button onClick={submitSearch} className="link-brand font-semibold">Search “{query}”</button>
              </div>
            ) : (
              suggestions.products.slice(0, 7).map((p) => (
                <button key={p.id} onClick={() => { setSuggestOpen(false); navigate(`/product/${p.slug}`) }} className="flex w-full items-center gap-3 border-b border-ink-100 px-4 py-2.5 text-left hover:bg-ink-50">
                  <img src={p.image || ''} alt="" className="h-10 w-10 rounded-lg bg-ink-100 object-cover" loading="lazy" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-800">{p.name}</span>
                    <span className="text-xs text-ink-500">₹{p.price.toLocaleString('en-IN')}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Category bar (desktop) */}
      <nav className="hidden border-t border-ink-100 lg:block">
        <div className="container-shopx flex h-11 items-center gap-1">
          <div ref={categoryRef} className="relative">
            <button
              onClick={() => setShowCategories((s) => !s)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-100"
            >
              <IconMenu className="h-4 w-4" /> All Categories <IconChevronDown className="h-3.5 w-3.5" />
            </button>
            {showCategories && (
              <div className="absolute left-0 top-full z-50 mt-1 flex min-h-[360px] w-[680px] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-banner animate-slide-down">
                <div className="w-56 shrink-0 overflow-y-auto border-r border-ink-100 py-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setShowCategories(false); navigate(`/products?category=${c.slug}`) }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {c.name}
                      <IconChevronRight className="h-4 w-4 text-ink-300" />
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <Link to="/products" onClick={() => setShowCategories(false)} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
                    Shop all products <IconChevronRight className="h-4 w-4" />
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    {(categories[0]?.children || []).slice(0, 8).map((child) => (
                      <Link key={child.slug} to={`/products?category=${child.slug}`} onClick={() => setShowCategories(false)} className="rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link to="/products?sort=featured" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100">Featured</Link>
          <Link to="/products?sort=newest" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100">New Arrivals</Link>
          <Link to="/products?sort=popular" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100">Best Sellers</Link>
          <Link to="/products?category=electronics" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100">Electronics</Link>
          <Link to="/products?category=fashion" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100">Fashion</Link>
          <Link to="/products?category=home-furniture" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100">Home</Link>
          <Link to="/products?discount=30" className="ml-auto rounded-lg px-3 py-2 text-sm font-bold text-accent-600 hover:bg-accent-50">🔥 Sale up to 50%</Link>
        </div>
      </nav>

      {/* Mobile slide-over menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-banner animate-slide-down">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
              <span className="text-lg font-extrabold text-ink-900">Shop<span className="text-brand-600">X</span></span>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100" aria-label="Close menu">
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isAuthenticated && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand-50 p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{user?.full_name[0]}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-900">{user?.full_name}</p>
                    <Link to="/account" className="text-xs text-brand-600">View account →</Link>
                  </div>
                </div>
              )}
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Shop</p>
              <MobileLink to="/" label="Home" />
              <MobileLink to="/products" label="All Products" />
              <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-ink-400">Categories</p>
              {categories.map((c) => (
                <div key={c.id}>
                  <MobileLink to={`/products?category=${c.slug}`} label={c.name} onClick={() => setMobileMenuOpen(false)} />
                  {c.children?.slice(0, 4).map((child) => (
                    <Link key={child.slug} to={`/products?category=${child.slug}`} onClick={() => setMobileMenuOpen(false)} className="block py-1.5 pl-6 text-sm text-ink-500 hover:text-brand-600">
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
              <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-ink-400">Account</p>
              {isAuthenticated ? (
                <>
                  <MobileLink to="/account" label="My Account" />
                  <MobileLink to="/account/orders" label="My Orders" />
                  <MobileLink to="/account/wishlist" label="Wishlist" />
                  <MobileLink to="/account/notifications" label="Notifications" />
                  <MobileLink to="/account/coupons" label="Coupons" />
                  {user?.role === 'admin' && <MobileLink to="/admin" label="Admin Dashboard" />}
                  <button onClick={logoutUser} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="btn-primary flex-1">Login</Link>
                  <Link to="/register" className="btn-outline flex-1">Sign up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function MenuLink({ to, label, icon, onClick }: { to: string; label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
      <span className="text-ink-400">{icon}</span> {label}
    </Link>
  )
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100">
      {label}
    </Link>
  )
}

function IconTag2() {
  return (
    <svg className="h-3.5 w-3.5 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 13.4L13.4 20.6a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" />
      <circle cx="8" cy="8" r="1.5" />
    </svg>
  )
}