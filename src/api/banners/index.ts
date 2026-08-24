import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

export interface Banner {
  id: number
  uuid: string
  title: string | null
  subtitle: string | null
  body: string | null
  image_url: string | null
  mobile_image_url: string | null
  link_type: string
  link_value: string | null
  type: string
  placement: string
  category_ids: number[]
  brand_ids: number[]
  product_ids: number[]
  search_keywords: string[]
  sort_order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export interface BannerQuery {
  placement: string
  category_id?: number
  q?: string
}

export const bannersApi = {
  async list(query: BannerQuery): Promise<Banner[]> {
    const searchParams = new URLSearchParams({ placement: query.placement })
    if (query.category_id) searchParams.set('category_id', String(query.category_id))
    if (query.q) searchParams.set('q', query.q)

    const res = await api.get('banners', { searchParams })
    const body = await parseApiResponse<Banner[]>(res)
    return (body.data as Banner[]) ?? []
  },
}
