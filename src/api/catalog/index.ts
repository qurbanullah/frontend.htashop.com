import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

export interface CatalogProduct {
  id: number
  uuid: string
  name: string
  slug: string
  route_key: string
  summary: string | null
  status: string
  is_active: boolean
  price: number | string | null
  sale_price: number | string | null
  currency: string | null
  image_url: string | null
  categories?: Array<{ id: number; name: string; slug: string }>
  brands?: Array<{ id: number; uuid: string; name: string; slug: string }>
  features?: Array<{ id: number; name: string; slug: string }>
  created_at: string
  updated_at: string
}

export interface CatalogProductsResponse {
  data: CatalogProduct[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface CatalogFiltersPayload {
  search?: string
  category_ids?: number[]
  brand_ids?: number[]
  feature_ids?: number[]
  min_price?: string
  max_price?: string
  sort?: string
  page?: number
  per_page?: number
}

export interface CatalogFilterOptions {
  brands: Array<{ id: number; name: string }>
  features: Array<{ id: number; name: string }>
  price_range: { min: number; max: number }
}

export interface CatalogVariant {
  id: number
  uuid: string
  name: string
  sku: string | null
  configuration: Record<string, unknown> | null
  price: number | string | null
  sale_price: number | string | null
  currency: string | null
  is_default: boolean
  image_url: string | null
}

export interface CatalogProductDetail extends CatalogProduct {
  description: string | null
  specs: Array<{ key: string; value: string; unit_id: number | null; unit_name: string }>
  gallery: string[]
  image_original_url: string | null
  gallery_original: string[]
  highlights: Array<{ id: number; label: string | null; heading: string | null; body: string }>
  manufacturers?: Array<{ id: number; uuid: string; name: string; slug: string }>
  variants: CatalogVariant[]
  stock: { track_inventory: boolean; available: number; low_stock: boolean }
}

function toSearchParams(params: CatalogFiltersPayload): URLSearchParams {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(`${key}[]`, String(item))
      }
    } else {
      searchParams.set(key, String(value))
    }
  }

  return searchParams
}

export interface SearchSuggestion {
  id: number
  uuid: string
  name: string
  slug: string
  route_key: string
  price: number | string | null
  sale_price: number | string | null
  currency: string | null
  image_url: string | null
  summary?: string | null
  brands?: Array<{ name: string }>
  categories?: Array<{ name: string }>
}

export interface SearchResultsResponse {
  data: CatalogProduct[]
  facets: Record<
    string,
    {
      counts: Array<{ value: string | number | null; count: number }>
      stats: { min?: number; max?: number; avg?: number; total_values?: number } | null
    }
  >
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
    search_time_ms: number
    fallback?: boolean
  }
}

export interface TrendingSearch {
  query: string
  count: number
}

function toSearchEndpointParams(
  params: CatalogFiltersPayload & { page?: number; per_page?: number }
): URLSearchParams {
  const searchParams = new URLSearchParams()
  const {
    search,
    category_ids,
    brand_ids,
    feature_ids,
    min_price,
    max_price,
    sort,
    page,
    per_page,
  } = params

  if (search) searchParams.set('q', search)
  if (category_ids?.length)
    for (const id of category_ids) searchParams.append('category_ids[]', String(id))
  if (brand_ids?.length) for (const id of brand_ids) searchParams.append('brand_ids[]', String(id))
  if (feature_ids?.length)
    for (const id of feature_ids) searchParams.append('feature_ids[]', String(id))
  if (min_price) searchParams.set('min_price', String(min_price))
  if (max_price) searchParams.set('max_price', String(max_price))
  if (sort) searchParams.set('sort', sort)
  if (page) searchParams.set('page', String(page))
  if (per_page) searchParams.set('per_page', String(per_page))

  return searchParams
}

export const catalogApi = {
  async suggest(query: string, categoryId?: number, limit = 8): Promise<SearchSuggestion[]> {
    const searchParams = new URLSearchParams({ q: query, limit: String(limit) })
    if (categoryId) searchParams.set('category_id', String(categoryId))

    const res = await api.get('search/suggest', { searchParams })
    const body = await parseApiResponse<{ data: SearchSuggestion[] }>(res)
    return body.data?.data ?? []
  },

  async search(
    params: CatalogFiltersPayload & { page?: number; per_page?: number }
  ): Promise<SearchResultsResponse> {
    const res = await api.get('search', { searchParams: toSearchEndpointParams(params) })
    const body = await parseApiResponse<SearchResultsResponse>(res)
    return (
      (body.data as SearchResultsResponse) ?? {
        data: [],
        facets: {},
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 12,
          total: 0,
          from: null,
          to: null,
          search_time_ms: 0,
        },
      }
    )
  },

  async trending(limit = 10): Promise<TrendingSearch[]> {
    const res = await api.get('search/trending', { searchParams: { limit: String(limit) } })
    const body = await parseApiResponse<{ data: TrendingSearch[] }>(res)
    return body.data?.data ?? []
  },

  async recordSearchClick(query: string, productId: number, sessionId?: string): Promise<void> {
    const body = new URLSearchParams({ q: query, product_id: String(productId) })
    if (sessionId) body.set('session_id', sessionId)

    const res = await api.post('search/click', { body })
    await parseApiResponse(res)
  },
  async products(params: CatalogFiltersPayload): Promise<CatalogProductsResponse> {
    const res = await api.get('catalog/products', {
      searchParams: toSearchParams(params),
    })
    const body = await parseApiResponse<CatalogProductsResponse>(res)
    return (
      (body.data as CatalogProductsResponse) ?? {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 12, total: 0, from: null, to: null },
      }
    )
  },

  async filters(): Promise<CatalogFilterOptions> {
    const res = await api.get('catalog/filters')
    const body = await parseApiResponse<CatalogFilterOptions>(res)
    return (
      (body.data as CatalogFilterOptions) ?? {
        brands: [],
        features: [],
        price_range: { min: 0, max: 0 },
      }
    )
  },

  async product(routeKey: string): Promise<CatalogProductDetail> {
    const res = await api.get(`catalog/products/${routeKey}`)
    const body = await parseApiResponse<CatalogProductDetail>(res)
    return body.data as CatalogProductDetail
  },
}
