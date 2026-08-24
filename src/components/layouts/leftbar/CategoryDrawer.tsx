import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogIn,
  LogOut,
  Phone,
  User,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Category, categoriesApi } from '@/api/categories'
import { useAuth } from '@/hooks/auth/useAuth'
import { paths } from '@/routes/paths'
import { useCategoryDrawerStore } from '@/stores/category-drawer'

function CategoryRow({
  category,
  onSelect,
}: {
  category: Category
  onSelect: (category: Category) => void
}) {
  const close = useCategoryDrawerStore((state) => state.close)
  const hasChildren = (category.children?.length ?? 0) > 0

  const rowClass =
    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'

  if (hasChildren) {
    return (
      <li>
        <button type="button" onClick={() => onSelect(category)} className={rowClass}>
          <span className="truncate">{category.name}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </li>
    )
  }

  return (
    <li>
      <Link to={`${paths.products}?category=${category.id}`} onClick={close} className={rowClass}>
        <span className="truncate">{category.name}</span>
      </Link>
    </li>
  )
}

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

function resolveAvatarUrl(
  user: { avatar_urls?: { medium?: string | null }; avatar_url?: string | null } | null
): string | null {
  const path = user?.avatar_urls?.medium || user?.avatar_url || ''
  if (!path) return null
  return path.startsWith('http') ? path : `https://cdn.htashop.com/${path}`
}

const QUICK_LINKS = [
  { label: 'Trending', to: `${paths.products}?sort=trending` },
  { label: 'Best Sellers', to: `${paths.products}?sort=best_sellers` },
  { label: 'New Releases', to: `${paths.products}?sort=newest` },
]

const CATEGORY_PREVIEW_COUNT = 4

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: category navigation drawer — renders a multi-level animated tree with auth header; header/breadcrumb already extracted to helpers
export function CategoryDrawer() {
  const isOpen = useCategoryDrawerStore((state) => state.isOpen)
  const close = useCategoryDrawerStore((state) => state.close)
  const { isAuthenticated, user, logout } = useAuth()
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [categoryPath, setCategoryPath] = useState<Category[]>([])
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward')

  const avatarUrl = resolveAvatarUrl(user)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['category-drawer-tree'],
    queryFn: () => categoriesApi.tree(),
    staleTime: 10 * 60 * 1000,
    enabled: isOpen,
  })

  const activeCategory = categoryPath[categoryPath.length - 1] ?? null
  const currentCategories = activeCategory?.children ?? categories
  const showPreview =
    !activeCategory && currentCategories.length > CATEGORY_PREVIEW_COUNT && !showAllCategories
  const visibleCategories = showPreview
    ? currentCategories.slice(0, CATEGORY_PREVIEW_COUNT)
    : currentCategories

  const handleCategorySelect = (category: Category) => {
    setSlideDirection('forward')
    setCategoryPath((prev) => [...prev, category])
  }

  const goBack = () => {
    setSlideDirection('back')
    setCategoryPath((prev) => prev.slice(0, -1))
  }

  const handleLogout = () => {
    close()
    logout()
  }

  // Lock page scroll while the drawer is open so only the drawer scrolls.
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="category-overlay"
          className="fixed inset-0 z-40 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
        />
      )}

      {isOpen && (
        <motion.div
          key="category-panel"
          className="fixed inset-y-0 left-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* User header */}
          <div className="flex items-center justify-between border-gray-200 border-b bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50">
            {isAuthenticated && user ? (
              <div className="flex min-w-0 items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-sm text-white">
                    {getUserInitials(user)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900 text-sm dark:text-white">
                    {user.name}
                  </p>
                  <p className="truncate text-gray-500 text-xs dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            ) : (
              <Link to={paths.login} onClick={close} className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                  <User className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-gray-500 text-xs dark:text-gray-400">Hello</span>
                  <span className="block font-semibold text-blue-600 text-sm dark:text-blue-400">
                    Sign in
                  </span>
                </span>
              </Link>
            )}

            <button
              type="button"
              onClick={close}
              className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto pb-6">
            {/* Quick links */}
            <div className="border-gray-100 border-b py-2 dark:border-gray-800">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={close}
                  className="block px-5 py-2.5 font-semibold text-gray-900 text-sm transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Shop by category */}
            <section className="border-gray-100 border-b py-2 dark:border-gray-800">
              <motion.div
                key={activeCategory?.id ?? 'root'}
                initial={{ x: slideDirection === 'forward' ? 40 : -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {activeCategory ? (
                  <div className="flex items-center gap-1 px-3 pt-3 pb-2">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-gray-900 text-sm transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <span className="truncate font-semibold text-gray-900 text-sm dark:text-white">
                      {activeCategory.name}
                    </span>
                  </div>
                ) : (
                  <h3 className="px-5 pt-3 pb-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                    Shop by Category
                  </h3>
                )}

                {activeCategory && (
                  <Link
                    to={`${paths.products}?category=${activeCategory.id}`}
                    onClick={close}
                    className="block px-5 py-2 font-semibold text-blue-600 text-sm transition-colors hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-800"
                  >
                    Shop all {activeCategory.name}
                  </Link>
                )}

                {isLoading ? (
                  <p className="px-5 py-3 text-gray-400 text-sm">Loading categories…</p>
                ) : currentCategories.length === 0 ? (
                  <p className="px-5 py-3 text-gray-400 text-sm">No subcategories available.</p>
                ) : (
                  <ul className="px-2">
                    {visibleCategories.map((category) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        onSelect={handleCategorySelect}
                      />
                    ))}
                  </ul>
                )}

                {!activeCategory && categories.length > CATEGORY_PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((value) => !value)}
                    className="mt-1 flex w-full items-center gap-1 px-5 py-2.5 text-left font-medium text-blue-600 text-sm transition-colors hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-800"
                    aria-expanded={showAllCategories}
                  >
                    {showAllCategories ? 'Show less' : 'Show all'}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${showAllCategories ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}

                {!activeCategory && (
                  <Link
                    to={paths.products}
                    onClick={close}
                    className="mt-1 block px-5 py-2.5 font-medium text-blue-600 text-sm transition-colors hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-800"
                  >
                    See all categories
                  </Link>
                )}
              </motion.div>
            </section>

            {/* Programs & features */}
            <section className="border-gray-100 border-b py-2 dark:border-gray-800">
              <h3 className="px-5 pt-3 pb-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                Programs &amp; Features
              </h3>
              <Link
                to={`${paths.products}?sort=newest`}
                onClick={close}
                className="block px-5 py-2.5 font-medium text-gray-800 text-sm transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                New Arrivals
              </Link>
              <Link
                to={paths.accountOrders}
                onClick={close}
                className="block px-5 py-2.5 font-medium text-gray-800 text-sm transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Track Order
              </Link>
            </section>

            {/* Help & settings */}
            <section className="py-2">
              <h3 className="px-5 pt-3 pb-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                Help &amp; Settings
              </h3>

              {isAuthenticated ? (
                <>
                  <Link
                    to={paths.account}
                    onClick={close}
                    className="flex items-center gap-3 px-5 py-2.5 font-medium text-gray-800 text-sm transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Your Account
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-5 py-2.5 text-left font-medium text-gray-800 text-sm transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <LogOut className="h-4 w-4 text-gray-400" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to={paths.login}
                  onClick={close}
                  className="flex items-center gap-3 px-5 py-2.5 font-medium text-gray-800 text-sm transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <LogIn className="h-4 w-4 text-gray-400" />
                  Sign in
                </Link>
              )}

              <a
                href="https://htashop.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-2.5 font-medium text-gray-800 text-sm transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <HelpCircle className="h-4 w-4 text-gray-400" />
                Help
              </a>
              <a
                href="https://htashop.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-2.5 font-medium text-gray-800 text-sm transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Phone className="h-4 w-4 text-gray-400" />
                Contact
              </a>
            </section>

            {/* Locale footer */}
            <div className="mx-5 mt-2 border-gray-100 border-t pt-4 text-gray-500 text-xs dark:border-gray-800 dark:text-gray-400">
              <p className="mt-1">English</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
