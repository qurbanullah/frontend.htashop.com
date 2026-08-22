import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Menu,
  Search,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Package,
  MapPin,
  User,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCartStore } from "@/stores/cart";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Logo } from "@/components/shared/Logo";
import { paths } from "@/routes/paths";
import { catalogApi } from "@/api/catalog";
import type { Category } from "@/api/categories";
import { useCategoryDrawerStore } from "@/stores/category-drawer";

function getUserInitials(user: {
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
} | null): string {
  if (!user) return "U";
  if (user.first_name && user.last_name) {
    return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
  }
  if (user.first_name) return user.first_name.charAt(0).toUpperCase();
  if (user.last_name) return user.last_name.charAt(0).toUpperCase();
  return user.name?.charAt(0)?.toUpperCase() ?? "U";
}

export function TopSearchBar({ categories }: { categories: Category[] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const cartCount = useCartStore((s) => s.count);
  const openCart = useCartStore((s) => s.openDrawer);
  const openCategories = useCategoryDrawerStore((s) => s.open);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const rootCategories = categories.filter((c) => c.parent_id == null || c.level === 0);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Debounce the search query by 1 second.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 1000);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: searchResult, isFetching } = useQuery({
    queryKey: ["storefront-search", debouncedQuery, categoryId],
    queryFn: () =>
      catalogApi.products({
        search: debouncedQuery,
        category_ids: categoryId ? [Number(categoryId)] : undefined,
        per_page: 8,
      }),
    enabled: debouncedQuery.length >= 3,
  });

  const searchResults = searchResult?.data ?? [];
  const showDropdown = searchOpen && debouncedQuery.length >= 3;

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (categoryId) params.set("category", categoryId);
    setSearchOpen(false);
    navigate(`${paths.products}?${params.toString()}`);
  };

  const avatarUrl = user?.avatar_urls?.medium || user?.avatar_url || null;
  const avatar = avatarUrl
    ? (avatarUrl.startsWith("http") ? avatarUrl : `https://cdn.htashop.com/${avatarUrl}`)
    : null;

  return (
    <div className="bg-[#131921] px-4 py-2.5 w-full">
      <div className="mx-auto flex max-w-[1920px] items-center gap-3">
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
        <Link to={paths.home} className="flex shrink-0 items-center gap-2" aria-label="HTAShop home">
          <Logo width={34} />
          <span className="hidden text-3xl font-extrabold tracking-tight text-white md:block">
            hta<span className="text-sky-500">shop</span>
          </span>
        </Link>

        {/* Live search */}
        <div ref={searchRef} className="relative min-w-0 flex-1 w-full">
          <form onSubmit={submitSearch} className="flex sm:mx-auto sm:max-w-6xl pl-6 items-stretch overflow-hidden rounded-lg">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="hidden w-40 shrink-0 border-r border-gray-300 bg-gray-100 px-3 text-sm text-gray-700 outline-none sm:block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Search category"
            >
              <option value="">All</option>
              {rootCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search htashop"
              className="h-10 min-w-0 flex-1 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:bg-gray-900 dark:text-white"
            />

            <button
              type="submit"
              className="flex h-10 w-12 shrink-0 items-center justify-center bg-sky-500 text-gray-900 transition-colors hover:bg-amber-400"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              {isFetching ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No products found</div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`${paths.products}/${product.route_key}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                        {product.brands?.[0] && (
                          <p className="truncate text-xs text-gray-400">{product.brands[0].name}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
                        ${Number(product.price ?? 0).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <Link
                to={`${paths.products}?q=${encodeURIComponent(debouncedQuery)}`}
                onClick={() => setSearchOpen(false)}
                className="block border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-blue-600 hover:bg-gray-50 dark:border-gray-800 dark:text-blue-400 dark:hover:bg-gray-800"
              >
                See all results for “{debouncedQuery}”
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />

          <button
            onClick={openCart}
            className="relative rounded-lg p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-gray-900">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1 rounded-lg p-1.5 text-white transition-colors hover:bg-white/10"
                aria-label="Account menu"
              >
                {avatar ? (
                  <img src={avatar} alt={user?.name ?? "User"} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {getUserInitials(user)}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-gray-300" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <Link to={paths.account} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                      <LayoutDashboard className="h-4 w-4 text-gray-400" /> My Account
                    </Link>
                    <Link to={paths.accountOrders} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                      <Package className="h-4 w-4 text-gray-400" /> Orders
                    </Link>
                    <Link to={paths.accountAddresses} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                      <MapPin className="h-4 w-4 text-gray-400" /> Addresses
                    </Link>
                    <Link to={paths.accountProfile} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                      <User className="h-4 w-4 text-gray-400" /> Profile
                    </Link>
                    <Link to={paths.accountSecurity} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                      <Settings className="h-4 w-4 text-gray-400" /> Security
                    </Link>
                    <button onClick={() => { setMenuOpen(false); logout(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Link to={paths.login} className="rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
                Sign in
              </Link>
              <Link to={paths.register} className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-400">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
