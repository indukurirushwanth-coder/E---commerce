import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { Category } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { IconPlus, IconEdit, IconTrash, IconGrid } from '@/components/ui/icons'
import { formatPrice } from '@/lib/format'

interface CategoryForm {
  name: string
  slug: string
  parent_id: number | null
  description: string
  image: string
}

const EMPTY_FORM: CategoryForm = { name: '', slug: '', parent_id: null, description: '', image: '' }

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    api.admin.categories()
      .then((res) => setCategories(res.data as Category[]))
      .catch(() => toast('Failed to load categories', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setAutoSlug(true)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id,
      description: cat.description || '',
      image: cat.image || '',
    })
    setAutoSlug(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Name is required', 'error')
      return
    }
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      parent_id: form.parent_id || null,
      description: form.description || null,
      image: form.image || null,
    }
    try {
      if (editId) {
        await api.admin.updateCategory(editId, payload)
        toast('Category updated')
      } else {
        await api.admin.createCategory(payload)
        toast('Category created')
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      toast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.admin.deleteCategory(deleteTarget.id)
      toast('Category deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast('Failed to delete category', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Categories</h1>
          <p className="mt-1 text-sm text-ink-500">{categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <IconPlus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center"><Spinner /></div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<IconGrid className="h-12 w-12" />}
          title="No categories"
          description="Create your first category"
          action={<button onClick={openAdd} className="btn-primary"><IconPlus className="h-4 w-4" /> Add Category</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Parent</th>
                  <th className="px-5 py-3 text-right">Products</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {cat.image && (
                          <img src={cat.image} alt="" className="h-8 w-8 rounded-lg object-cover bg-ink-100" />
                        )}
                        <span className="font-semibold text-ink-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-500 font-mono text-xs">{cat.slug}</td>
                    <td className="px-5 py-3 text-ink-600">
                      {cat.parent_id
                        ? categories.find((c) => c.id === cat.parent_id)?.name || '—'
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-ink-600">{cat.product_count ?? 0}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="rounded-lg p-2 text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }))
                if (autoSlug) setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))
              }}
              className="input"
              placeholder="Category name"
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => { setAutoSlug(false); setForm((f) => ({ ...f, slug: e.target.value })) }}
              className="input"
              placeholder="category-slug"
            />
          </div>
          <div>
            <label className="label">Parent Category</label>
            <select
              value={form.parent_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value ? Number(e.target.value) : null }))}
              className="input"
            >
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => !c.parent_id && c.id !== editId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input min-h-[80px] resize-y"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="label">Image URL</label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Products in this category will become uncategorized.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
