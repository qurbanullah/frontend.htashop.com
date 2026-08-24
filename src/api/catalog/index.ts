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

export const catalogApi = {
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
