import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/api/client'
import type { CartData } from '@/types'
import { useAuth } from '@/context/AuthContext'

interface CartContextValue {
  cart: CartData | null
  itemCount: number
  loading: boolean
  refreshCart: () => Promise<void>
  addItem: (product_id: number, variant_id?: number | null, quantity?: number) => Promise<CartData>
  updateQuantity: (id: number, quantity: number) => Promise<void>
  removeItem: (id: number) => Promise<void>
  toggleSaveForLater: (id: number) => Promise<void>
  applyCoupon: (code: string) => Promise<CartData>
  removeCoupon: () => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null)
      return
    }
    setLoading(true)
    try {
      const res = await api.getCart()
      setCart(res.data)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addItem = useCallback(
    async (product_id: number, variant_id?: number | null, quantity = 1) => {
      const res = await api.addToCart({ product_id, variant_id, quantity })
      setCart(res.data)
      return res.data
    },
    [],
  )

  const updateQuantity = useCallback(async (id: number, quantity: number) => {
    const res = await api.updateCartItem(id, quantity)
    setCart(res.data)
  }, [])

  const removeItem = useCallback(async (id: number) => {
    const res = await api.removeCartItem(id)
    setCart(res.data)
  }, [])

  const toggleSaveForLater = useCallback(async (id: number) => {
    const res = await api.saveForLater(id)
    setCart(res.data)
  }, [])

  const applyCoupon = useCallback(async (code: string) => {
    const res = await api.applyCoupon(code)
    setCart(res.data)
    return res.data
  }, [])

  const removeCoupon = useCallback(async () => {
    const res = await api.removeCoupon()
    setCart(res.data)
  }, [])

  const clearCart = useCallback(async () => {
    const res = await api.clearCart()
    setCart(res.data)
  }, [])

  const itemCount = useMemo(() => cart?.item_count ?? 0, [cart])

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      loading,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      toggleSaveForLater,
      applyCoupon,
      removeCoupon,
      clearCart,
    }),
    [cart, itemCount, loading, refreshCart, addItem, updateQuantity, removeItem, toggleSaveForLater, applyCoupon, removeCoupon, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}