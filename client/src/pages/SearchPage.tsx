import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { Product } from '@/types'
import { useToast } from '@/context/ToastContext'
import { formatPrice } from '@/lib/format'
import { Spinner } from '@/components/ui/Spinner'
import {
  IconChevronRight,
  IconRefresh,
  IconSearch,
  IconTag,
  IconX,
} from '@/components/ui/icons'

interface Suggestion {
  products: Product[]
  categories: Array<{ name: string; slug: string }>
  brands: Array<{ name: string; slug: string }>
}

const EMPTY_SUGGESTIONS: Suggestion = { products: [], categories: [], brands: [] }

const TRENDING_TAGS = [
  'Wireless Headphones',
  'Smartwatch',
  'Running Shoes',
  'Sofa',
  'Backpack',
  'Skincare',
  'Gaming',
  'Home Decor',
]

export default function SearchPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(params.get('q') || '')
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion>(EMPTY_SUGGESTIONS)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [recents, setRecents] = useState<Array<{ query: string; last_seen: string }>>([])
  const [popularCategories, setPopularCategories] = useState<Array<{ name: string; slug: string }>>([])

  // Auto-focus the input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const loadRecents = useCallback(async () => {
    try {
      const res = await api.recentSearches()
      setRecents(res.data)
    } catch {
      setRecents([])
    }
  }, [])

  useEffect(() => {
    loadRecents()
  }, [loadRecents])

  useEffect(() => {
    api
      .getCategories()
      .then((res) => setPopularCategories((res.data as Array<{ name: string; slug: string }>).slice(0, 8)))
      .catch(() => {})
  }, [])

  // Debounced suggestions
  useEffect(() => {
    const term = query.trim()
    if (!term) {
      setSuggestions(EMPTY_SUGGESTIONS)
      setSuggestLoading(false)
      return
    }
    setSuggestLoading(true)
    const t = setTimeout(() => {
      api
        .searchSuggest(term)
        .then((res) => setSuggestions(res.data))
        .catch(() => setSuggestions(EMPTY_SUGGESTIONS))
        .finally(() => setSuggestLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    inputRef.current?.blur()
    setFocused(false)
    navigate(`/products?q=${encodeURIComponent(term)}`)
  }

  const goToProduct = (slug: string) => {
    setFocused(false)
    setQuery('')
    navigate(`/product/${slug}`)
  }

  const goToCategory = (slug: string) => {
    setFocused(false)
    setQuery('')
    navigate(`/products?category=${slug}`)
  }

  const goToBrand = (slug: string) => {
    setFocused(false)
    setQuery('')
    navigate(`/products?brand=${slug}`)
  }

  const goToQuery = (term: string) => {
    setQuery(term)
    inputRef.current?.focus()
  }

  const clearHistory = async () => {
    try {
      await api.clearSearchHistory()
      setRecents([])
      toast('Search history cleared')
    } catch {
      toast('Could not clear search history', 'error')
    }
  }

  const showRecent = focused && !query.trim()
  const showDropdown = focused && !!query.trim()

  return (
    <div className="container-shopx py-6">
      {/* Search input */}
      <form onSubmit={submit} className="mx-auto max-w-2xl">
        <div className="relative">
          <IconSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search for products, brands and more…"
            autoComplete="off"
            className="input !rounded-full !py-3.5 !pl-12 !pr-12 !text-base shadow-card focus:!ring-brand-500/25"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
              aria-label="Clear search"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-600 p-2 text-white shadow-sm transition-colors hover:bg-brand-700"
            aria-label="Search"
          >
            <IconSearch className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="mx-auto mt-4 max-w-2xl">
        {/* Recent searches */}
        {showRecent && recents.length > 0 && (
          <div className="animate-slide-down rounded-2xl border border-ink-200 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Recent searches</p>
              <button onClick={clearHistory} className="flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-red-500">
                <IconRefresh className="h-3.5 w-3.5" /> Clear history
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {recents.slice(0, 10).map((r, i) => (
                <button
                  key={`${r.query}-${i}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToQuery(r.query)}
                  className="flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-sm text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <IconSearch className="h-3.5 w-3.5 text-ink-400" /> {r.query}
                </button>
              ))}
            </div>
          </div>
        )}

        {showRecent && recents.length === 0 && (
          <div className="animate-slide-down rounded-2xl border border-ink-200 bg-white p-4 text-sm text-ink-500 shadow-card">
            Your recent searches will appear here. Try searching for a product, brand or category.
          </div>
        )}

        {/* Suggestions dropdown */}
        {showDropdown && (
          <div className="animate-slide-down overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-cardHover">
            {suggestLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-500">
                <Spinner size="sm" /> Searching…
              </div>
            ) : suggestions.products.length === 0 && suggestions.categories.length === 0 && suggestions.brands.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-500">
                <p>No suggestions found for “{query.trim()}”.</p>
                <button onMouseDown={(e) => e.preventDefault()} onClick={submit} className="link-brand mt-2 font-semibold">
                  Search all results for “{query.trim()}”
                </button>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {suggestions.products.length > 0 && (
                  <>
                    <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Products</p>
                    {suggestions.products.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => goToProduct(p.slug)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-ink-50"
                      >
                        <img src={p.image || ''} alt="" className="h-11 w-11 rounded-lg bg-ink-100 object-cover" loading="lazy" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-800">{p.name}</span>
                          <span className="block text-xs text-ink-500">{formatPrice(p.price)}</span>
                        </span>
                        <IconChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                      </button>
                    ))}
                  </>
                )}
                {suggestions.categories.length > 0 && (
                  <>
                    <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">Categories</p>
                    {suggestions.categories.map((c) => (
                      <button
                        key={c.slug}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => goToCategory(c.slug)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                      >
                        <IconTag className="h-4 w-4 text-ink-400" /> {c.name}
                        <IconChevronRight className="ml-auto h-4 w-4 text-ink-300" />
                      </button>
                    ))}
                  </>
                )}
                {suggestions.brands.length > 0 && (
                  <>
                    <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">Brands</p>
                    {suggestions.brands.map((b) => (
                      <button
                        key={b.slug}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => goToBrand(b.slug)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                      >
                        <IconTag className="h-4 w-4 text-ink-400" /> {b.name}
                        <IconChevronRight className="ml-auto h-4 w-4 text-ink-300" />
                      </button>
                    ))}
                  </>
                )}
                {suggestions.products.length > 0 && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={submit}
                    className="mt-2 w-full rounded-xl border-t border-ink-100 px-3 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50"
                  >
                    See all results for “{query.trim()}”
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Popular categories */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-ink-900">Popular Categories</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {popularCategories.map((c) => (
              <button
                key={c.slug}
                onClick={() => navigate(`/products?category=${c.slug}`)}
                className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-left text-sm font-semibold text-ink-700 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-600 hover:shadow-card"
              >
                <span className="line-clamp-1">{c.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs font-normal text-ink-400">Shop now <IconChevronRight className="h-3 w-3" /></span>
              </button>
            ))}
          </div>
        </section>

        {/* Trending tags */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink-900">Trending now</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRENDING_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => navigate(`/products?q=${encodeURIComponent(t)}`)}
                className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm text-ink-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}