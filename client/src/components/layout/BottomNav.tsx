import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { IconBag, IconCart, IconHeart, IconHome, IconSearch, IconUser } from '@/components/ui/icons'

export default function BottomNav() {
  const { isAuthenticated } = useAuth()
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()

  const items = [
    { to: '/', label: 'Home', icon: IconHome, exact: true },
    { to: '/search', label: 'Search', icon: IconSearch },
    { to: '/cart', label: 'Cart', icon: IconCart, badge: isAuthenticated ? itemCount : 0 },
    { to: '/account/wishlist', label: 'Wishlist', icon: IconHeart, badge: isAuthenticated ? wishlistCount : 0 },
    { to: '/account', label: 'Account', icon: IconUser },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-ink-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <item.icon className={`h-[22px] w-[22px] ${isActive ? '' : ''}`} strokeWidth={isActive ? 2.2 : 1.8} />
                  {(item.badge ?? 0) > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                      {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}