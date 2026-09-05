import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { Product } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { IconPlus, IconEdit, IconTrash, IconSearch, IconBag, IconEye } from '@/components/ui/icons'
import { formatPrice } from '@/lib/format'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    api.admin.products()
      .then((res) => setProducts(res.data))
      .catch(() => toast('Failed to load products', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category_name?.toLowerCase().includes(q),
    )
  }, [products, search])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.admin.deleteProduct(deleteTarget.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast('Product deleted')
      setDeleteTarget(null)
    } catch {
      toast('Failed to delete product', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const togglePublish = async (product: Product) => {
    try {
      await api.admin.togglePublish(product.id, !product.is_published)
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_published: p.is_published ? 0 : 1 } : p,
        ),
      )
      toast(product.is_published ? 'Product unpublished' : 'Product published')
    } catch {
      toast('Failed to update product', 'error')
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Products</h1>
          <p className="mt-1 text-sm text-ink-500">{products.length} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <IconPlus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IconBag className="h-12 w-12" />}
          title="No products found"
          description={search ? 'Try a different search term' : 'Add your first product to get started'}
          action={
            !search && (
              <Link to="/admin/products/new" className="btn-primary">
                <IconPlus className="h-4 w-4" /> Add Product
              </Link>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || ''}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover bg-ink-100"
                        />
                        <div>
                          <p className="font-semibold text-ink-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-ink-400">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          product.stock <= 0
                            ? 'text-red-500'
                            : product.stock <= 5
                            ? 'text-amber-600'
                            : 'text-ink-700'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => togglePublish(product)}
                        className={`badge cursor-pointer transition-colors ${
                          product.is_published
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
                        }`}
                      >
                        {product.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                          className="rounded-lg p-2 text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          title="Edit"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
