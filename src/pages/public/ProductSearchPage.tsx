import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Loader2, Package } from "lucide-react";
import { catalogApi, type CatalogFiltersPayload } from "@/api/catalog";
import { categoriesApi, type Category } from "@/api/categories";
import { FilterSidebar, type CatalogSelection } from "@/components/catalog/FilterSidebar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { BannerZone } from "@/components/banners/BannerRenderer";
import { Seo, siteUrl } from "@/components/seo/Seo";

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "best_sellers", label: "Best Sellers" },
  { value: "trending", label: "Trending" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
];

export default function ProductSearchPage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<CatalogFiltersPayload>({
    search: "",
    category_ids: [],
    brand_ids: [],
    feature_ids: [],
    min_price: "",
    max_price: "",
    sort: "newest",
    page: 1,
    per_page: 12,
  });

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const sort = SORT_OPTIONS.find((option) => option.value === searchParams.get("sort"))?.value;

    setFilters((prev) => ({
      ...prev,
      search: q,
      category_ids: category ? [Number(category)] : prev.category_ids,
      brand_ids: brand ? [Number(brand)] : prev.brand_ids,
      sort: sort ?? prev.sort,
      page: 1,
    }));
  }, [searchParams]);

  const debouncedFilters = useDebouncedValue(filters, 350);

  const { data: filterOptions } = useQuery({
    queryKey: ["catalog-filters"],
    queryFn: () => catalogApi.filters(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["catalog-products", debouncedFilters],
    queryFn: () => catalogApi.products(debouncedFilters),
  });

  const { data: categoryTree = [] } = useQuery({
    queryKey: ["storefront-categories"],
    queryFn: () => categoriesApi.tree(),
    staleTime: 10 * 60 * 1000,
  });

  const products = result?.data ?? [];
  const meta = result?.meta;

  // ── SEO context ────────────────────────────────────────────────────────
  const query = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category");
  const categoryId = categoryParam ? Number(categoryParam) : undefined;
  const categoryName = (() => {
    if (!categoryId) return undefined;
    const flatten = (cats: Category[]): Category | undefined => {
      for (const c of cats) {
        if (c.id === categoryId) return c;
        const found = c.children ? flatten(c.children) : undefined;
        if (found) return found;
      }
      return undefined;
    };
    return flatten(categoryTree)?.name;
  })();
  const isSearch = Boolean(query.trim());
  const currentPage = filters.page ?? 1;

  const seoTitle = isSearch
    ? `Search results for "${query.trim()}"`
    : categoryName
      ? categoryName
      : "Shop Products";
  const seoDescription = isSearch
    ? `Browse products matching "${query.trim()}" on HTAShop — electronics, IT, MRO, and industrial supplies with secure payments and fast delivery.`
    : categoryName
      ? `Shop ${categoryName} products online at HTAShop — verified suppliers, secure payments, and fast delivery across Pakistan.`
      : "Shop a wide range of products online at HTAShop — electronics, IT, MRO, and industrial supplies from verified suppliers with secure payments and fast delivery.";

  const seoCanonical = (() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (categoryParam) params.set("category", categoryParam);
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    if (currentPage > 1) params.set("page", String(currentPage));
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  })();

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: isSearch ? "Search" : categoryName ?? "Products",
        item: siteUrl(seoCanonical),
      },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: seoTitle,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 12).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: siteUrl(`/products/${product.route_key}`),
      name: product.name,
    })),
  };

  const selection: CatalogSelection = {
    brandIds: filters.brand_ids ?? [],
    featureIds: filters.feature_ids ?? [],
    minPrice: filters.min_price ?? "",
    maxPrice: filters.max_price ?? "",
  };

  const updateSelection = (patch: Partial<CatalogSelection>) => {
    setFilters((prev) => ({
      ...prev,
      brand_ids: patch.brandIds ?? prev.brand_ids,
      feature_ids: patch.featureIds ?? prev.feature_ids,
      min_price: patch.minPrice ?? prev.min_price,
      max_price: patch.maxPrice ?? prev.max_price,
      page: 1,
    }));
  };

  const clearSelection = () => {
    setFilters((prev) => ({
      ...prev,
      brand_ids: [],
      feature_ids: [],
      min_price: "",
      max_price: "",
      page: 1,
    }));
  };

  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">
      <Seo
        title={seoTitle}
        description={seoDescription}
        keywords={[query.trim(), categoryName, "HTAShop", "buy online Pakistan"].filter(Boolean) as string[]}
        canonical={seoCanonical}
        type="website"
        noindex={isSearch}
        jsonLd={[breadcrumbLd, itemListLd]}
      />

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar (desktop) — starts from the top, below the top bar */}
        <div className="hidden lg:block">
          <FilterSidebar
            brands={filterOptions?.brands ?? []}
            features={filterOptions?.features ?? []}
            selection={selection}
            onChange={updateSelection}
            onClear={clearSelection}
          />
        </div>

        {/* Main — banner + results in the same column as the sidebar */}
        <div className="min-w-0">
          {/* Banner zone — category or search placement based on context */}
          <BannerZone
            placement={searchParams.get("category") ? "category" : "search"}
            categoryId={searchParams.get("category") ? Number(searchParams.get("category")) : undefined}
            q={searchParams.get("q") ?? undefined}
            fullWidth
          />

          {/* Sort + mobile filters */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            <select
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))}
              className="ml-auto h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:w-52"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {meta && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total} products
            </p>
          )}

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center dark:border-gray-800">
              <Package className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No products found</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => goToPage(meta.current_page - 1)}
                disabled={meta.current_page <= 1}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                onClick={() => goToPage(meta.current_page + 1)}
                disabled={meta.current_page >= meta.last_page}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-white p-5 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar
              brands={filterOptions?.brands ?? []}
              features={filterOptions?.features ?? []}
              selection={selection}
              onChange={updateSelection}
              onClear={clearSelection}
            />
          </div>
        </div>
      )}
    </div>
  );
}
