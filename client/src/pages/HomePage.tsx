import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import type { HomeData } from '@/types'
import ProductSection from '@/components/product/ProductSection'
import ProductCard from '@/components/product/ProductCard'
import { ProductGridSkeleton } from '@/components/product/ProductSkeleton'
import { useFlashSaleEnd, useCountdown } from '@/hooks/useCountdown'
import { IconBolt, IconChevronRight, IconStar, IconTruck, IconShield, IconRefresh } from '@/components/ui/icons'
import { useToast } from '@/context/ToastContext'

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [bannerIdx, setBannerIdx] = useState(0)
  const flashSaleEnd = useFlashSaleEnd()
  const countdown = useCountdown(flashSaleEnd)

  useEffect(() => {
    api
      .getHome()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data?.banners?.length) return
    const id = setInterval(() => setBannerIdx((i) => (i + 1) % data.banners.length), 6000)
    return () => clearInterval(id)
  }, [data])

  if (loading) {
    return (
      <div className="container-shopx pt-8">
        <div className="skeleton h-72 rounded-3xl sm:h-80" />
        <div className="skeleton mt-8 h-8 w-64 rounded" />
        <ProductGridSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container-shopx flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-ink-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-ink-500">We couldn't load the storefront.</p>
        <Link to="/products" className="btn-primary mt-5">Browse products</Link>
      </div>
    )
  }

  const banners = data.banners || []
  const active = banners[bannerIdx] || banners[0]

  return (
    <div className="container-shopx">
      {/* Hero banner */}
      {active && (
        <section className="relative mt-4 overflow-hidden rounded-3xl shadow-banner sm:mt-6">
          <div className="relative h-[300px] sm:h-[380px] lg:h-[440px]">
            <img src={active.image} alt={active.title} className="h-full w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
              <span className="badge mb-3 w-fit bg-accent-500 text-white">{active.tagline}</span>
              <h1 className="max-w-lg text-3xl font-extrabold leading-tight text-white sm:text-5xl">{active.title}</h1>
              <p className="mt-3 max-w-md text-sm text-white/80 sm:text-base">{active.subtitle}</p>
              <div className="mt-6">
                <Link to={active.link} className="btn-accent rounded-full px-7 py-3">
                  {active.cta} <IconChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
          {banners.length > 1 && (
            <div className="absolute bottom-4 right-6 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                  aria-label={`Go to banner ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* USP strip */}
      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: <IconTruck className="h-5 w-5" />, title: 'Free Delivery', desc: 'On orders above ₹999' },
          { icon: <IconShield className="h-5 w-5" />, title: 'Secure Payments', desc: '100% payment protection' },
          { icon: <IconRefresh className="h-5 w-5" />, title: '7-Day Returns', desc: 'Easy returns & refunds' },
          { icon: <IconStar className="h-5 w-5" />, title: '4.8★ Rated', desc: 'By 50k+ happy customers' },
        ].map((u) => (
          <div key={u.title} className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{u.icon}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900">{u.title}</p>
              <p className="truncate text-xs text-ink-500">{u.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">Shop by Category</h2>
            <p className="mt-1 text-sm text-ink-500">Find everything you need, all in one place</p>
          </div>
          <Link to="/products" className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:underline sm:flex">
            View all <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {data.categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-cardHover"
            >
              <div className="h-28 overflow-hidden bg-ink-100 sm:h-36">
                {c.image && <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-ink-900 group-hover:text-brand-600">{c.name}</p>
                <p className="mt-0.5 text-xs text-ink-500">{c.product_count ?? 0} products</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash sale */}
      <section className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-accent-600 via-accent-500 to-amber-500 p-6 sm:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 text-white">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <IconBolt className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">Flash Sale</h2>
              <p className="mt-0.5 text-sm text-white/85">Up to 60% off — ends in</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            {[
              { label: 'Hrs', value: countdown.hours },
              { label: 'Min', value: countdown.minutes },
              { label: 'Sec', value: countdown.seconds },
            ].map((t) => (
              <div key={t.label} className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
                <div className="text-2xl font-extrabold text-white tabular-nums">{String(t.value).padStart(2, '0')}</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-white/80">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-2">
          {(data.featured || []).slice(0, 8).map((p) => (
            <div key={p.id} className="w-40 shrink-0 sm:w-48">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Product rows */}
      <div className="mt-2">
        <ProductSection title="Trending Now" subtitle="What everyone's buying right now" products={data.trending} link="/products?sort=popular" />
        <ProductSection title="Best Sellers" subtitle="Proven favorites, loved by thousands" products={data.best_sellers} link="/products?sort=popular" />
        <ProductSection title="New Arrivals" subtitle="Fresh drops, just landed" products={data.new_arrivals} link="/products?sort=newest" accent />
        <ProductSection title="Featured Deals" subtitle="Handpicked for you" products={data.featured} link="/products" />
      </div>

      {/* Reviews */}
      <ReviewsStrip />
    </div>
  )
}

function ReviewsStrip() {
  const { toast } = useToast()
  const reviews = [
    { name: 'Aarav Mehta', rating: 5, text: 'Absolutely love ShopX! The NovaTech phone arrived in 2 days with perfect packaging. Will shop here again.', product: 'NovaTech X1 Pro' },
    { name: 'Sneha Sharma', rating: 5, text: 'Best prices I could find anywhere. The flash sale deals are incredible and COD option is super convenient.', product: 'SonicWave Headphones' },
    { name: 'Rohan Kapoor', rating: 4, text: 'Great selection of products and the delivery was quick. The return process was smooth when I needed it.', product: 'CloudPeak UltraBook' },
    { name: 'Priya Nair', rating: 5, text: 'Ordered furniture for my new apartment. Quality exceeded expectations and customer support was very helpful.', product: 'EverHome Sofa' },
  ]
  return (
    <section className="mt-14">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">Loved by Thousands of Customers</h2>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-ink-500">
          <span className="font-bold text-ink-900">4.8/5</span> average rating
          <span className="flex text-amber-400">{[1, 2, 3, 4, 5].map((i) => <IconStar key={i} className="h-4 w-4" />)}</span>
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.map((r) => (
          <div key={r.name} className="card flex flex-col p-5">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].slice(0, r.rating).map((i) => <IconStar key={i} className="h-4 w-4" />)}
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">“{r.text}”</p>
            <div className="mt-4">
              <p className="text-sm font-bold text-ink-900">{r.name}</p>
              <p className="text-xs text-ink-500">Verified buyer · {r.product}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}