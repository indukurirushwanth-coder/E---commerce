import { Link } from 'react-router-dom'
import type { Product } from '@/types'
import ProductCard from '@/components/product/ProductCard'
import { IconChevronRight } from '@/components/ui/icons'

interface ProductSectionProps {
  title: string
  subtitle?: string
  products: Product[]
  link?: string
  linkLabel?: string
  accent?: boolean
}

export default function ProductSection({ title, subtitle, products, link, linkLabel = 'View all', accent }: ProductSectionProps) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold tracking-tight sm:text-2xl ${accent ? 'text-accent-600' : 'text-ink-900'}`}>{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            {linkLabel}
            <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.slice(0, 12).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}