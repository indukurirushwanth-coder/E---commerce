import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { Category } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { IconChevronLeft, IconCheck } from '@/components/ui/icons'

interface FormState {
  name: string
  slug: string
  description: string
  sku: string
  category_id: number | ''
  brand: string
  price: string
  compare_at_price: string
  stock: string
  tags: string
  is_published: boolean
  is_featured: boolean
  is_trending: boolean
  is_best_seller: boolean
  is_new: boolean
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  description: '',
  sku: '',
  category_id: '',
  brand: '',
  price: '',
  compare_at_price: '',
  stock: '',
  tags: '',
  is_published: true,
  is_featured: false,
  is_trending: false,
  is_best_seller: false,
  is_new: false,
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)

  useEffect(() => {
    api.admin.categories().then((res) => setCategories(res.data as Category[])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    api.admin.product(Number(id))
      .then((res) => {
        const p = res.data
        setForm({
          name: p.name,
          slug: p.slug,
          description: p.description || '',
          sku: p.sku || '',
          category_id: p.category_id || '',
          brand: (p as any).brand || '',
          price: String(p.price),
          compare_at_price: String(p.compare_at_price || ''),
          stock: String(p.stock),
          tags: p.tags || '',
          is_published: !!p.is_published,
          is_featured: !!p.is_featured,
          is_trending: !!p.is_trending,
          is_best_seller: !!p.is_best_seller,
          is_new: !!p.is_new,
        })
        setAutoSlug(false)
      })
      .catch(() => toast('Failed to load product', 'error'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const update = (field: keyof FormState, value: string | boolean | number) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && autoSlug) {
        next.slug = slugify(String(value))
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      toast('Name and price are required', 'error')
      return
    }
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      description: form.description,
      sku: form.sku || undefined,
      category_id: form.category_id || undefined,
      brand: form.brand || undefined,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock: Number(form.stock) || 0,
      tags: form.tags || undefined,
      is_published: form.is_published,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      is_best_seller: form.is_best_seller,
      is_new: form.is_new,
    }

    try {
      if (isEdit && id) {
        await api.admin.updateProduct(Number(id), payload)
        toast('Product updated')
      } else {
        await api.admin.createProduct(payload)
        toast('Product created')
      }
      navigate('/admin/products')
    } catch (err: any) {
      toast(err.message || 'Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <button
        onClick={() => navigate('/admin/products')}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
      >
        <IconChevronLeft className="h-4 w-4" /> Back to Products
      </button>

      <h1 className="text-2xl font-bold text-ink-900">
        {isEdit ? 'Edit Product' : 'Add Product'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-base font-bold text-ink-900">Basic Info</h2>

          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input"
              placeholder="Product name"
              required
            />
          </div>

          <div>
            <label className="label">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false)
                update('slug', e.target.value)
              }}
              className="input"
              placeholder="product-slug"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="input min-h-[120px] resize-y"
              placeholder="Product description"
            />
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-base font-bold text-ink-900">Organization</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => update('sku', e.target.value)}
                className="input"
                placeholder="SKU-001"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => update('category_id', e.target.value ? Number(e.target.value) : '')}
                className="input"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => update('brand', e.target.value)}
              className="input"
              placeholder="Brand name"
            />
          </div>

          <div>
            <label className="label">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => update('tags', e.target.value)}
              className="input"
              placeholder="Comma-separated tags"
            />
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-base font-bold text-ink-900">Pricing & Stock</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Price *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                className="input"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="label">Compare at Price</label>
              <input
                type="number"
                value={form.compare_at_price}
                onChange={(e) => update('compare_at_price', e.target.value)}
                className="input"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="label">Stock *</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => update('stock', e.target.value)}
                className="input"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-ink-900">Visibility</h2>

          {[
            { key: 'is_published' as const, label: 'Published' },
            { key: 'is_featured' as const, label: 'Featured' },
            { key: 'is_trending' as const, label: 'Trending' },
            { key: 'is_best_seller' as const, label: 'Best Seller' },
            { key: 'is_new' as const, label: 'New Arrivals' },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form[opt.key]}
                onChange={(e) => update(opt.key, e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-ink-700">{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <IconCheck className="h-4 w-4" />
            )}
            {isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="btn-outline"
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
