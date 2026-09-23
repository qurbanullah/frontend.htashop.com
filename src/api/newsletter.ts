import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

export interface NewsletterSubscribePayload {
  email: string
  consent?: boolean
  source_page?: string
}

export interface NewsletterSubscription {
  email: string
  is_subscribed: boolean
}

export interface UnsubscribeStatus {
  type: string
  type_label: string
  email: string | null
  is_subscribed: boolean
}

/**
 * Subscribe an email to the store newsletter (public).
 */
export const newsletterApi = {
  async subscribe(payload: NewsletterSubscribePayload): Promise<NewsletterSubscription> {
    const res = await api.post('newsletter/subscribe', {
      json: payload,
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<NewsletterSubscription>(res)
    return body.data as NewsletterSubscription
  },

  async status(token: string): Promise<UnsubscribeStatus> {
    const res = await api.get(`unsubscribe/${encodeURIComponent(token)}`, {
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<UnsubscribeStatus>(res)
    return body.data as UnsubscribeStatus
  },

  async unsubscribe(token: string): Promise<UnsubscribeStatus> {
    const res = await api.post(`unsubscribe/${encodeURIComponent(token)}/unsubscribe`, {
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<UnsubscribeStatus>(res)
    return body.data as UnsubscribeStatus
  },

  async resubscribe(token: string): Promise<UnsubscribeStatus> {
    const res = await api.post(`unsubscribe/${encodeURIComponent(token)}/resubscribe`, {
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<UnsubscribeStatus>(res)
    return body.data as UnsubscribeStatus
  },
}
