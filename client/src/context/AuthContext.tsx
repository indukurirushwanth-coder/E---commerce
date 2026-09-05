import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, auth as tokenStore } from '@/api/client'
import type { User } from '@/types'
import { useToast } from '@/context/ToastContext'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<User>
  register: (data: { full_name: string; email: string; phone?: string; password: string }) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
  updateUser: (u: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const refreshUser = useCallback(async () => {
    if (!tokenStore.getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await api.me()
      setUser(res.user)
    } catch {
      tokenStore.clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('shopx:logout', onLogout)
    return () => window.removeEventListener('shopx:logout', onLogout)
  }, [])

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      const res = await api.login({ email, password })
      if (remember) tokenStore.setToken(res.token)
      else tokenStore.setTokenSession(res.token)
      setUser(res.user)
      toast(`Welcome back, ${res.user.full_name.split(' ')[0]}!`)
      return res.user
    },
    [toast],
  )

  const register = useCallback(
    async (data: { full_name: string; email: string; phone?: string; password: string }) => {
      const res = await api.register(data)
      tokenStore.setToken(res.token)
      setUser(res.user)
      return res.user
    },
    [],
  )

  const logout = useCallback(() => {
    tokenStore.clearToken()
    setUser(null)
  }, [])

  const updateUser = useCallback((u: User) => setUser(u), [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [user, loading, login, register, logout, refreshUser, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}