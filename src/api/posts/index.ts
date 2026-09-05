import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

export interface PostSummary {
  id: number
  uuid: string
  slug: string
  type: string
  title: string
  excerpt: string | null
  featured_image: string | null
  featured_image_url: string | null
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

async function listByType(type: 'blog' | 'news' | 'event', params: ListParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set('search', params.search)
  if (params.page && params.page > 1) searchParams.set('page', String(params.page))
  searchParams.set('per_page', String(params.per_page ?? 12))

  const res = await api.get(type === 'blog' ? 'blogs' : type === 'news' ? 'news' : 'events', {
    searchParams,
  })
  const body = await parseApiResponse<PostListData>(res)
  return (
    (body.data as PostListData) ?? {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 },
    }
  )
}

export const postsApi = {
  blogs(params?: ListParams) {
    return listByType('blog', params)
  },
  news(params?: ListParams) {
    return listByType('news', params)
  },
  events(params?: ListParams) {
    return listByType('event', params)
  },
  async show(slug: string): Promise<PostDetail> {
    const res = await api.get(`posts/${encodeURIComponent(slug)}`)
    const body = await parseApiResponse<PostDetail>(res)
    return body.data as PostDetail
  },
}
