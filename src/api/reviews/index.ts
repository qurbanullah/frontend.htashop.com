import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'

export interface ReviewUser {
  id: number
  name: string
}

export interface Review {
  uuid: string
  rating: number
  title: string | null
  body: string
  is_recommended: boolean
  is_verified_purchase: boolean
  helpful_count: number
  not_helpful_count: number
  created_at: string
  user: ReviewUser | null
}

export interface ReviewSummary {
  average: number
  count: number
  distribution: Record<number, number>
}

export interface ReviewListData {
  data: Review[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface CreateReviewPayload {
  rating: number
  title?: string
  body: string
  is_recommended?: boolean
}

export const reviewsApi = {
  async list(routeKey: string, page = 1, perPage = 10): Promise<ReviewListData> {
    const res = await api.get(`catalog/products/${routeKey}/reviews`, {
      searchParams: { page, per_page: perPage },
    })
    const body = await parseApiResponse<ReviewListData>(res)
    return (
      (body.data as ReviewListData) ?? {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: perPage, total: 0, from: null, to: null },
      }
    )
  },

  async summary(routeKey: string): Promise<ReviewSummary> {
    const res = await api.get(`catalog/products/${routeKey}/reviews/summary`)
    const body = await parseApiResponse<ReviewSummary>(res)
    return (
      (body.data as ReviewSummary) ?? {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }
    )
  },

  async create(routeKey: string, payload: CreateReviewPayload): Promise<Review> {
    const res = await api.post(`catalog/products/${routeKey}/reviews`, {
      json: payload,
      headers: authHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<Review>(res)
    return body.data as Review
  },

  async vote(
    uuid: string,
    helpful: boolean
  ): Promise<{ helpful_count: number; not_helpful_count: number }> {
    const res = await api.post(`reviews/${uuid}/helpful`, {
      json: { helpful },
      headers: authHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<{ helpful_count: number; not_helpful_count: number }>(res)
    return body.data
  },
}
