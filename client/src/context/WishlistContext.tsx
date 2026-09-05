import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/api/client'
import type { WishlistItem } from '@/types'
import { useAuth } from '@/context/AuthContext'

interface WishlistContextValue {
  items: WishlistItem[]
  count: number
  loading: boolean
  refreshWishlist: () => Promise<void>
  addItem: (product_id: number, variant_id?: number | null) => Promise<void>
  removeItem: (product_id: number) => Promise<void>
  moveToCart: (product_id: number) => Promise<void>
  isInWishlist: (product_id: number) => boolean
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const res = await api.getWishlist()
      setItems(res.data.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshWishlist()
  }, [refreshWishlist])

  const addItem = useCallback(async (product_id: number, variant_id?: number | null) => {
    await api.addToWishlist(product_id, variant_id)
    await refreshWishlist()
  }, [refreshWishlist])

  const removeItem = useCallback(async (product_id: number) => {
    await api.removeFromWishlist(product_id)
    setItems((prev) => prev.filter((i) => i.product_id !== product_id))
  }, [])

  const moveToCart = useCallback(async (product_id: number) => {
    await api.moveWishlistToCart(product_id)
    await refreshWishlist()
  }, [refreshWishlist])

  const isInWishlist = useCallback((product_id: number) => items.some((i) => i.product_id === product_id), [items])

  const value = useMemo(
    () => ({ items, count: items.length, loading, refreshWishlist, addItem, removeItem, moveToCart, isInWishlist }),
    [items, loading, refreshWishlist, addItem, removeItem, moveToCart, isInWishlist],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}