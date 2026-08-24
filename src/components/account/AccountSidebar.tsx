import { Cookie, LayoutDashboard, MapPin, Package, ShieldCheck, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const NAV_ITEMS = [
  { to: paths.account, label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: paths.accountOrders, label: 'Orders', icon: Package },
  { to: paths.accountAddresses, label: 'Addresses', icon: MapPin },
  { to: paths.accountProfile, label: 'Profile', icon: User },
  { to: paths.accountSecurity, label: 'Security', icon: ShieldCheck },
  { to: paths.accountPrivacy, label: 'Privacy', icon: Cookie },
]

function isActive(pathname: string, item: { to: string; exact?: boolean }): boolean {
  if (item.exact) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

/**
 * Left account navigation. On desktop it is a sticky vertical rail; on mobile
 * it collapses to a horizontally scrollable tab bar.
 */
export function AccountSidebar() {
  const { pathname } = useLocation()

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="sticky top-30 space-y-1 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="px-3 pt-1 pb-2 font-semibold text-gray-400 text-xs uppercase tracking-wider">
            My Account
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile tabs */}
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-medium text-sm transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
