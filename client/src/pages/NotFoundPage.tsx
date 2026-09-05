import { Link } from 'react-router-dom'
import { IconBack, IconSearch } from '@/components/ui/icons'

export default function NotFoundPage() {
  return (
    <div className="container-shopx flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center">
        <span className="text-[7rem] font-extrabold leading-none tracking-tight text-brand-600 sm:text-[9rem]">4</span>
        <span className="-mx-2 flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-600 text-white sm:h-32 sm:w-32 sm:rounded-[2rem]">
          <IconSearch className="h-12 w-12 sm:h-16 sm:w-16" />
        </span>
        <span className="text-[7rem] font-extrabold leading-none tracking-tight text-brand-600 sm:text-[9rem]">4</span>
      </div>

      <h1 className="mt-4 text-2xl font-extrabold text-ink-900 sm:text-3xl">Page not found</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
        The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn-primary px-6 py-3">
          <IconBack className="h-4 w-4" /> Back to home
        </Link>
        <Link to="/products" className="btn-outline px-6 py-3">Browse products</Link>
      </div>
    </div>
  )
}
