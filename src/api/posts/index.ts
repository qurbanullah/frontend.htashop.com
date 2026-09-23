import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import type { ImageUrls } from '@/lib/image-srcset'

export interface PostSummary {
  id: number
  uuid: string
  slug: string
  type: string
  title: string
  excerpt: string | null
  featured_image: string | null
  featured_image_url: string | null
  featured_image_urls?: ImageUrls | null
  published_at: string | null
  url: string
  frontend_url: string
  tags: string[]
  categories: string[]
  primary_category_id: number | null
  primary_category: { id: number; name: string; slug: string } | null
  description: string | null
  link: string
  date: string | null
  category: string | null
}

export interface PostDetail extends PostSummary {
  content: string
}

export interface PostListData {
  data: PostSummary[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

interface ListParams {
  search?: string
  page?: number
  per_page?: number
}

/**
 * Lists published posts for one content section.
 *
 * Every section is a filter on the same public endpoint (`?type=…`) rather than
 * its own endpoint, so adding a content type needs no API route. `latest=1`
 * keeps newest-first ordering.
 */
async function listByType(type: string, params: ListParams = {}): Promise<PostListData> {
  const searchParams = new URLSearchParams()
  searchParams.set('type', type)
  searchParams.set('latest', '1')
  if (params.search) searchParams.set('search', params.search)
  if (params.page && params.page > 1) searchParams.set('page', String(params.page))
  searchParams.set('per_page', String(params.per_page ?? 12))

  const res = await api.get('posts', { searchParams })
  const body = await parseApiResponse<PostListData>(res)
  return (
    (body.data as PostListData) ?? {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 },
    }
  )
}

export const postsApi = {
  byType: listByType,
  async show(slug: string): Promise<PostDetail> {
    const res = await api.get(`posts/${encodeURIComponent(slug)}`)
    const body = await parseApiResponse<PostDetail>(res)
    return body.data as PostDetail
  },
}
