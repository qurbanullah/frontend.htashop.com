import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { catalogApi, type SearchSuggestion } from '@/api/catalog'
import type { Category } from '@/api/categories'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuth } from '@/hooks/auth/useAuth'
import { paths } from '@/routes/paths'
import type { User as AuthUser } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useCategoryDrawerStore } from '@/stores/category-drawer'

function getUserInitials(
  user: {
    first_name?: string | null
    last_name?: string | null
    name?: string | null
  } | null
): string {
  if (!user) return 'U'
  if (user.first_name && user.last_name) {
    return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase()
  }
  if (user.first_name) return user.first_name.charAt(0).toUpperCase()
  if (user.last_name) return user.last_name.charAt(0).toUpperCase()
  return user.name?.charAt(0)?.toUpperCase() ?? 'U'
}

function formatPrice(price: number | string | null): string {
  return `$${Number(price ?? 0).toLocaleString()}`
}

// ── Search results dropdown ──

function SearchDropdown({
  isFetching,
  results,
  query,
  onSelect,
}: {
  isFetching: boolean
  results: SearchSuggestion[]
  query: string
  onSelect: (product: SearchSuggestion | null) => void
}) {
  if (isFetching) {
    return <div className="px-4 py-6 text-center text-gray-400 text-sm">Searching…</div>
  }

  if (results.length === 0) {
    return <div className="px-4 py-6 text-center text-gray-400 text-sm">No products found</div>
  }

  return (
    <>
      <div className="max-h-96 overflow-y-auto">
        {results.map((product) => (
          <Link
            key={product.id}
            to={`${paths.products}/${product.route_key}`}
            onClick={() => onSelect(product)}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900 text-sm dark:text-white">
                {product.name}
              </p>
              {product.brands?.[0] && (
                <p className="truncate text-gray-400 text-xs">{product.brands[0].name}</p>
              )}
            </div>
            <span className="shrink-0 font-semibold text-gray-900 text-sm dark:text-white">
              {formatPrice(product.price)}
            </span>
          </Link>
        ))}
      </div>

      <Link
        to={`${paths.products}?q=${encodeURIComponent(query)}`}
        onClick={() => onSelect(null)}
        className="block border-gray-100 border-t px-4 py-2.5 text-center font-medium text-blue-600 text-sm hover:bg-gray-50 dark:border-gray-800 dark:text-blue-400 dark:hover:bg-gray-800"
      >
        See all results for “{query}”
      </Link>
    </>
  )
}

// ── Account dropdown menu ──

function AccountMenu({
  user,
  avatar,
  menuOpen,
  onToggle,
  onClose,
  onLogout,
}: {
  user: AuthUser | null
  avatar: string | null
  menuOpen: boolean
  onToggle: () => void
  onClose: () => void
  onLogout: () => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 rounded-lg p-1.5 text-white transition-colors hover:bg-white/10"
        aria-label="Account menu"
        aria-expanded={menuOpen}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={user?.name ?? 'User'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-semibold text-white text-xs">
            {getUserInitials(user)}
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-gray-300" />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={onClose}
          />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="border-gray-100 border-b px-4 py-3 dark:border-gray-700">
              <p className="truncate font-semibold text-gray-900 text-sm dark:text-white">
                {user?.name}
              </p>
              <p className="truncate text-gray-500 text-xs dark:text-gray-400">{user?.email}</p>
            </div>
            <Link
              to={paths.account}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <LayoutDashboard className="h-4 w-4 text-gray-400" /> My Account
            </Link>
            <Link
              to={paths.accountOrders}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Package className="h-4 w-4 text-gray-400" /> Orders
            </Link>
            <Link
              to={paths.accountAddresses}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <MapPin className="h-4 w-4 text-gray-400" /> Addresses
            </Link>
            <Link
              to={paths.accountProfile}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <User className="h-4 w-4 text-gray-400" /> Profile
            </Link>
            <Link
              to={paths.accountSecurity}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Settings className="h-4 w-4 text-gray-400" /> Security
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-red-600 text-sm hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Top bar ──

export function TopSearchBar({ categories }: { categories: Category[] }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const cartCount = useCartStore((s) => s.count)
  const openCart = useCartStore((s) => s.openDrawer)
  const openCategories = useCategoryDrawerStore((s) => s.open)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const rootCategories = categories.filter((c) => c.parent_id == null || c.level === 0)

  useEffect(() => {
    setMenuOpen(false)
  }, [])

  // Debounce the search query by 250ms — instant suggestions without spamming the API.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: searchResult, isFetching } = useQuery({
    queryKey: ['storefront-suggest', debouncedQuery, categoryId],
    queryFn: () => catalogApi.suggest(debouncedQuery, categoryId ? Number(categoryId) : undefined),
    enabled: debouncedQuery.length >= 2,
  })

  const { data: trending = [] } = useQuery({
    queryKey: ['search-trending-topbar'],
    queryFn: () => catalogApi.trending(8),
    enabled: searchOpen && query.trim() === '',
    staleTime: 15 * 60 * 1000,
  })

  const searchResults = searchResult ?? []
  const showDropdown = searchOpen && debouncedQuery.length >= 2

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (categoryId) params.set('category', categoryId)
    setSearchOpen(false)
    navigate(`${paths.products}?${params.toString()}`)
  }

  const avatarUrl = user?.avatar_urls?.medium || user?.avatar_url || null
  const avatar = avatarUrl
    ? avatarUrl.startsWith('http')
      ? avatarUrl
      : `https://cdn.htashop.com/${avatarUrl}`
    : null

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
  }

  return (
    <div className="w-full bg-[#131921] px-4 py-2.5">
      <div className="shell mx-auto flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={openCategories}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link
          to={paths.home}
          className="flex shrink-0 items-center gap-2"
          aria-label="HTAShop home"
        >
          <Logo width={34} />
          <span className="hidden font-extrabold text-3xl text-white tracking-tight md:block">
            HTA<span className="text-sky-500">shop</span>
          </span>
        </Link>

        {/* Live search */}
        <div ref={searchRef} className="relative w-full min-w-0 flex-1">
          <form
            onSubmit={submitSearch}
            className="flex items-stretch overflow-hidden rounded-lg pl-6 sm:mx-auto sm:max-w-6xl"
          >
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="hidden w-40 shrink-0 border-gray-300 border-r bg-gray-100 px-3 text-gray-700 text-sm outline-none sm:block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Search category"
            >
              <option value="">All</option>
              {rootCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search htashop"
              className="h-10 min-w-0 flex-1 bg-white px-3 text-gray-900 text-sm outline-none placeholder:text-gray-400 dark:bg-gray-900 dark:text-white"
            />

            <button
              type="submit"
              className="flex h-10 w-12 shrink-0 items-center justify-center bg-sky-500 text-gray-900 transition-colors hover:bg-amber-400"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          {searchOpen && query.trim() === '' && trending.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              <p className="mb-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                Trending searches
              </p>
              <div className="flex flex-wrap gap-2">
                {trending.map(({ query: term, count }) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false)
                      navigate(`${paths.products}?q=${encodeURIComponent(term)}`)
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-gray-700 text-xs transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
                  >
                    {term}
                    <span className="text-gray-400">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showDropdown && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              <SearchDropdown
                isFetching={isFetching}
                results={searchResults}
                query={debouncedQuery}
                onSelect={(selected) => {
                  setSearchOpen(false)
                  if (selected) {
                    catalogApi.recordSearchClick(debouncedQuery, selected.id).catch(() => {})
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />

          <button
            type="button"
            onClick={openCart}
            className="relative rounded-lg p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 font-bold text-[10px] text-gray-900">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <AccountMenu
              user={user}
              avatar={avatar}
              menuOpen={menuOpen}
              onToggle={() => setMenuOpen(!menuOpen)}
              onClose={() => setMenuOpen(false)}
              onLogout={handleLogout}
            />
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                to={paths.login}
                className="rounded-lg px-3 py-2 font-medium text-sm text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                to={paths.register}
                className="rounded-lg bg-sky-500 px-3 py-2 font-semibold text-gray-900 text-sm transition-colors hover:bg-amber-400"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
