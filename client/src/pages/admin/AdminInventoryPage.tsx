import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { IconSettings, IconRefresh, IconBox, IconMinus, IconPlus } from '@/components/ui/icons'
import { formatPrice, formatDate } from '@/lib/format'

type Tab = 'all' | 'low' | 'out'

export default function AdminInventoryPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [products, setProducts] = useState<any[]>([])
  const [low, setLow] = useState<any[]>([])
  const [out, setOut] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustTarget, setAdjustTarget] = useState<any>(null)
  const [adjustQty, setAdjustQty] = useState('0')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    Promise.all([
      api.admin.inventory(),
      api.admin.inventoryHistory(),
    ])
      .then(([invRes, histRes]) => {
        setProducts(invRes.data.products || [])
        setLow(invRes.data.low || [])
        setOut(invRes.data.out || [])
        setHistory(histRes.data || [])
      })
      .catch(() => toast('Failed to load inventory', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeList = tab === 'low' ? low : tab === 'out' ? out : products

  const openAdjust = (product: any) => {
    setAdjustTarget(product)
    setAdjustQty('0')
    setAdjustReason('')
  }

  const handleAdjust = async () => {
    if (!adjustTarget) return
    const qty = Number(adjustQty)
    if (qty === 0) {
      toast('Enter a quantity', 'error')
      return
    }
    setAdjusting(true)
    try {
      await api.admin.adjustStock({
        product_id: adjustTarget.id,
        quantity: qty,
        reason: adjustReason || undefined,
      })
      toast(`Stock ${qty > 0 ? 'added' : 'removed'} successfully`)
      setAdjustTarget(null)
      load()
    } catch (err: any) {
      toast(err.message || 'Failed to adjust stock', 'error')
    } finally {
      setAdjusting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center"><Spinner /></div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Inventory</h1>
        <p className="mt-1 text-sm text-ink-500">Manage stock levels and inventory history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Products" value={products.length} icon={IconBox} color="bg-brand-100 text-brand-600" />
        <SummaryCard label="Low Stock" value={low.length} icon={IconRefresh} color="bg-amber-100 text-amber-600" />
        <SummaryCard label="Out of Stock" value={out.length} icon={IconSettings} color="bg-red-100 text-red-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-ink-100 p-1 w-fit">
        {([
          { key: 'all' as Tab, label: `All (${products.length})` },
          { key: 'low' as Tab, label: `Low Stock (${low.length})` },
          { key: 'out' as Tab, label: `Out of Stock (${out.length})` },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {activeList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-400">
                    {tab === 'low' ? 'No low stock products' : tab === 'out' ? 'No out of stock products' : 'No products'}
                  </td>
                </tr>
              ) : (
                activeList.map((p: any) => (
                  <tr key={p.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || ''}
                          alt={p.name}
                          className="h-9 w-9 rounded-lg object-cover bg-ink-100"
                        />
                        <span className="font-semibold text-ink-900 line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-500">{p.sku || '—'}</td>
                    <td className="px-5 py-3 text-right font-bold">
                      <span
                        className={
                          p.stock <= 0
                            ? 'text-red-500'
                            : p.stock <= 5
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StockBadge stock={p.stock} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openAdjust(p)}
                        className="btn-outline text-xs py-1.5 px-3"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory History */}
      {history.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-bold text-ink-900">Inventory History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Change</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {history.map((h: any, i: number) => (
                  <tr key={h.id || i} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-ink-900">{h.product_name || h.name || '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`font-bold ${
                          h.quantity > 0 ? 'text-emerald-600' : h.quantity < 0 ? 'text-red-500' : 'text-ink-600'
                        }`}
                      >
                        {h.quantity > 0 ? '+' : ''}{h.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{h.reason || '—'}</td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(h.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} title="Adjust Stock" size="sm">
        {adjustTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <img
                src={adjustTarget.image || ''}
                alt=""
                className="h-10 w-10 rounded-lg object-cover bg-ink-200"
              />
              <div>
                <p className="font-semibold text-ink-900">{adjustTarget.name}</p>
                <p className="text-xs text-ink-500">Current stock: {adjustTarget.stock}</p>
              </div>
            </div>

            <div>
              <label className="label">Quantity Change</label>
              <p className="text-xs text-ink-500 mb-2">Use positive to add stock, negative to remove</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjustQty(String(Math.max(Number(adjustQty) - 1, -adjustTarget.stock)))}
                  className="btn-outline p-2"
                >
                  <IconMinus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="input text-center text-lg font-bold w-24"
                />
                <button
                  onClick={() => setAdjustQty(String(Number(adjustQty) + 1))}
                  className="btn-outline p-2"
                >
                  <IconPlus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="label">Reason</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="input"
                placeholder="e.g. Restock, Damaged, Return"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-outline" onClick={() => setAdjustTarget(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdjust} disabled={adjusting}>
                {adjusting ? 'Saving...' : 'Apply Adjustment'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.FC<any>
  color: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="text-2xl font-bold text-ink-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="badge bg-red-100 text-red-700">Out of Stock</span>
  if (stock <= 5) return <span className="badge bg-amber-100 text-amber-700">Low Stock</span>
  return <span className="badge bg-emerald-100 text-emerald-700">In Stock</span>
}
