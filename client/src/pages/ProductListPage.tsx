import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import type { Brand, Product, Category } from '@/types'
import ProductCard from '@/components/product/ProductCard'
import { ProductGridSkeleton } from '@/components/product/ProductSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { DiscountBadge } from '@/components/ui/Price'
import { IconChevronDown, IconFilter, IconX } from '@/components/ui/icons'

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
  { value: 'popular', label: 'Most Popular' },
]

const PRICE_RANGES = [
  { label: 'Under ₹1,000', min: 0, max: 999 },
  { label: '₹1,000 – ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 – ₹15,000', min: 5000, max: 15000 },
  { label: '₹15,000 – ₹50,000', min: 15000, max: 50000 },
  { label: 'Above ₹50,000', min: 50000, max: null },
]

const DISCOUNT_OPTIONS = [
  { label: '10% or more', value: 10 },
  { label: '20% or more', value: 20 },
  { label: '30% or more', value: 30 },
  { label: '50% or more', value: 50 },
]

export default function ProductListPage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Array<Category & { children?: Category[] }>>([])
  const [filterOpen, setFilterOpen] = useState(false)

  const page = Number(params.get('page')) || 1
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const brand = params.get('brand') || ''
  const sort = params.get('sort') || 'featured'
  const minPrice = params.get('min_price') || ''
  const maxPrice = params.get('max_price') || ''
  const rating = params.get('rating') || ''
  const discount = params.get('discount') || ''
  const availability = params.get('availability') || ''

  const filters = useMemo(
    () => ({
      q, category, brand, sort, minPrice, maxPrice, rating, discount, availability,
    }),
    [q, category, brand, sort, minPrice, maxPrice, rating, discount, availability],
  )

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  useEffect(() => {
    api
      .getBrands()
      .then((r) => setBrands(r.data as Brand[]))
      .catch(() => {})
    api
      .getCategories()
      .then((r) => setCategories(r.data as any))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .getProducts({
        q,
        category,
        brand,
        sort,
        min_price: minPrice,
        max_price: maxPrice,
        rating,
        discount,
        availability,
        page,
        perPage: 24,
      })
      .then((res) => {
        setProducts(res.data)
        setTotal(res.pagination.total)
        setTotalPages(res.pagination.totalPages)
      })
      .catch(() => {
        setProducts([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
  }, [q, category, brand, sort, minPrice, maxPrice, rating, discount, availability, page])

  const activeFilterCount = [brand, minPrice, maxPrice, rating, discount, availability].filter((v) => v).length

  const categoryInfo = categories.find((c) => c.slug === category)

  const currentCategory = category;
  const childCats = categoryInfo?.children || []

  return (
    <div className="container-shopx py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">
            {q ? `Results for "${q}"` : categoryInfo?.name || 'All Products'}
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">{total} products found</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline lg:hidden" onClick={() => setFilterOpen(true)}>
            <IconFilter className="h-4 w-4" /> Filters {activeFilterCount > 0 && <span className="badge bg-brand-600 text-white">{activeFilterCount}</span>}
          </button>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input w-auto appearance-none pr-10 font-medium"
              aria-label="Sort products"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <FilterPanel filters={filters} updateParam={updateParam} brands={brands} categories={categories} currentCategory={currentCategory} childCats={childCats} />
        </aside>

        {/* Product grid */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description={q ? `We couldn't find any products matching "${q}". Try a different search or clear filters.` : "Try adjusting your filters to find more products."}
              action={<button className="btn-primary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear all filters</button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPage={(p) => updateParam('page', String(p))} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" size="sm">
        <FilterPanel filters={filters} updateParam={updateParam} brands={brands} categories={categories} currentCategory={currentCategory} childCats={childCats} onApplied={() => setFilterOpen(false)} />
      </Modal>
    </div>
  )
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn-outline px-3 py-2 disabled:pointer-events-none disabled:opacity-40">
        Prev
      </button>
      {start > 1 && <span className="px-2 text-sm text-ink-400">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`h-10 w-10 rounded-xl text-sm font-semibold transition-colors ${p === page ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-400'}`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="px-2 text-sm text-ink-400">…</span>}
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="btn-outline px-3 py-2 disabled:pointer-events-none disabled:opacity-40">
        Next
      </button>
    </div>
  )
}

interface FilterPanelProps {
  filters: Record<string, string>
  updateParam: (key: string, value: string) => void
  brands: Brand[]
  categories: Array<Category & { children?: Category[] }>
  currentCategory: string
  childCats: Category[]
  onApplied?: () => void
}

function FilterPanel({ filters, updateParam, brands, categories, currentCategory, childCats, onApplied }: FilterPanelProps) {
  const price = filters.minPrice || filters.maxPrice

  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Category</h4>
        <div className="space-y-1">
          <button
            onClick={() => { updateParam('category', ''); updateParam('q', ''); onApplied?.() }}
            className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${!currentCategory && !filters.q ? 'bg-brand-50 font-bold text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { updateParam('category', c.slug); updateParam('q', ''); onApplied?.() }}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${currentCategory === c.slug ? 'bg-brand-50 font-bold text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {childCats.length > 0 && (
          <div className="mt-3 space-y-1 border-l-2 border-ink-100 pl-3">
            {childCats.map((c) => (
              <button
                key={c.id}
                onClick={() => { updateParam('category', c.slug); updateParam('q', ''); onApplied?.() }}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${currentCategory === c.slug ? 'bg-brand-50 font-bold text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Brand */}
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Brand</h4>
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          {brands.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm hover:bg-ink-50">
              <input
                type="checkbox"
                checked={filters.brand === b.slug}
                onChange={() => updateParam('brand', filters.brand === b.slug ? '' : b.slug)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className={filters.brand === b.slug ? 'font-semibold text-ink-900' : 'text-ink-600'}>{b.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Price Range</h4>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((r) => {
            const active = (filters.minPrice === String(r.min) && filters.maxPrice === (r.max === null ? '' : String(r.max))) || (r.min === 0 && r.max === 999 && price === '0' && filters.maxPrice === '999')
            const isActive = filters.minPrice === String(r.min) && (r.max === null ? filters.maxPrice === '' : filters.maxPrice === String(r.max))
            return (
              <button
                key={r.label}
                onClick={() => {
                  updateParam('min_price', String(r.min))
                  updateParam('max_price', r.max === null ? '' : String(r.max))
                  onApplied?.()
                }}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${isActive ? 'bg-brand-50 font-bold text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
              >
                {r.label}
              </button>
            )
          })}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              placeholder="Min"
              defaultValue={filters.minPrice}
              onKeyDown={(e) => { if (e.key === 'Enter') { updateParam('min_price', (e.target as HTMLInputElement).value); onApplied?.() } }}
              className="input !rounded-lg !py-1.5"
            />
            <span className="text-ink-400">–</span>
            <input
              type="number"
              placeholder="Max"
              defaultValue={filters.maxPrice}
              onKeyDown={(e) => { if (e.key === 'Enter') { updateParam('max_price', (e.target as HTMLInputElement).value); onApplied?.() } }}
              className="input !rounded-lg !py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Customer Rating</h4>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => { updateParam('rating', filters.rating === String(r) ? '' : String(r)); onApplied?.() }}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${filters.rating === String(r) ? 'bg-brand-50 font-bold text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
            >
              {'★'.repeat(r)}{'☆'.repeat(5 - r)} <span className="text-xs text-ink-400"> & up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Discount</h4>
        <div className="space-y-1">
          {DISCOUNT_OPTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => { updateParam('discount', filters.discount === String(d.value) ? '' : String(d.value)); onApplied?.() }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm ${filters.discount === String(d.value) ? 'bg-brand-50 font-bold text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
            >
              <span>{d.label}</span>
              <DiscountBadge discount={d.value} />
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Availability</h4>
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm hover:bg-ink-50">
            <input
              type="radio"
              name="availability"
              checked={filters.availability === 'available'}
              onChange={() => { updateParam('availability', filters.availability === 'available' ? '' : 'available'); onApplied?.() }}
              className="h-4 w-4 border-ink-300 text-brand-600"
            />
            In stock only
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm hover:bg-ink-50">
            <input
              type="radio"
              name="availability"
              checked={filters.availability === 'out_of_stock'}
              onChange={() => { updateParam('availability', filters.availability === 'out_of_stock' ? '' : 'out_of_stock'); onApplied?.() }}
              className="h-4 w-4 border-ink-300 text-brand-600"
            />
            Out of stock
          </label>
        </div>
      </div>

      {(filters.brand || filters.minPrice || filters.maxPrice || filters.rating || filters.discount || filters.availability || filters.category || filters.q) && (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-50"
          onClick={() => { onApplied?.(); }}
        >
          <IconX className="h-4 w-4" />
          Apply Filters
        </button>
      )}
    </div>
  )
}