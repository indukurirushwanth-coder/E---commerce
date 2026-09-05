import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { Notification } from '@/types'
import { Spinner, ButtonSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconChevronRight, IconBell, IconBag, IconTag, IconHeart, IconTrash, IconCheckCircle, IconStar, IconShield } from '@/components/ui/icons'
import { timeAgo } from '@/lib/format'

const TYPE_ICON: Record<string, { icon: any; bg: string }> = {
  order: { icon: IconBag, bg: 'bg-brand-50 text-brand-600' },
  coupon: { icon: IconTag, bg: 'bg-emerald-50 text-emerald-600' },
  wishlist: { icon: IconHeart, bg: 'bg-red-50 text-red-500' },
  review: { icon: IconStar, bg: 'bg-amber-50 text-amber-600' },
  security: { icon: IconShield, bg: 'bg-blue-50 text-blue-600' },
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications()
      setNotifications(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await api.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })))
    } catch {
      // ignore
    } finally {
      setMarkingAll(false)
    }
  }

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await api.markNotificationRead(n.id)
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)))
      } catch {
        // ignore
      }
    }
    if (n.meta) {
      try {
        const meta = JSON.parse(n.meta)
        if (meta.order_id) navigate(`/account/orders/${meta.order_id}`)
        else if (meta.slug) navigate(`/product/${meta.slug}`)
      } catch {
        // ignore
      }
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await api.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="container-shopx mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/account" className="hover:text-brand-600">Account</Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-900">Notifications</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            {markingAll ? <ButtonSpinner /> : <IconCheckCircle className="h-4 w-4" />}
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<IconBell className="h-12 w-12" />}
          title="No notifications yet"
          description="We'll notify you about orders, coupons and updates here"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const conf = TYPE_ICON[n.type] || { icon: IconBell, bg: 'bg-ink-100 text-ink-500' }
            const Icon = conf.icon
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border bg-white p-4 shadow-card transition-all hover:shadow-cardHover ${
                  n.is_read ? 'border-ink-100' : 'border-brand-100 bg-brand-50/30'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${conf.bg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${n.is_read ? 'text-ink-900' : 'text-ink-900'}`}>{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-ink-600">{n.body}</p>}
                  <p className="mt-1 text-xs text-ink-400">{timeAgo(n.created_at)}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  disabled={deletingId === n.id}
                  className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-danger"
                  aria-label="Delete notification"
                >
                  {deletingId === n.id ? <ButtonSpinner /> : <IconTrash className="h-4 w-4" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}