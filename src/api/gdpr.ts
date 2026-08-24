import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'
import { getConsentToken } from '@/lib/consent/consent-token'
import type { ConsentCategories, ConsentSource } from '@/lib/consent/constants'

export interface RecordConsentPayload {
  consent_token: string
  categories: ConsentCategories
  policy_version: string
  source: ConsentSource
}

export interface GdprConsentDto {
  id: number
  uuid: string
  consent_token: string
  categories: ConsentCategories
  policy_version: string
  source: string
  accepted_at: string | null
  created_at: string | null
}

export interface PaginatedConsentResponse {
  data: GdprConsentDto[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

/**
 * GDPR consent API — records a server-side audit trail of consent choices.
 * All calls are best-effort: consent is never blocked on the network.
 */
export const gdprApi = {
  async record(payload: RecordConsentPayload): Promise<void> {
    const res = await api.post('gdpr/consents', {
      json: payload,
      throwHttpErrors: false,
    })
    await parseApiResponse(res)
  },

  async latest(): Promise<GdprConsentDto | null> {
    const token = encodeURIComponent(getConsentToken())
    const res = await api.get(`gdpr/consents/latest?consent_token=${token}`, {
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<GdprConsentDto | null>(res)
    return body.data
  },

  async withdraw(): Promise<void> {
    const token = encodeURIComponent(getConsentToken())
    const res = await api.delete(`gdpr/consents?consent_token=${token}`, {
      throwHttpErrors: false,
    })
    await parseApiResponse(res)
  },

  /** Authenticated consent history (privacy center). */
  async history(): Promise<PaginatedConsentResponse> {
    const res = await api.get('gdpr/consents', { headers: authHeaders() })
    const body = await parseApiResponse<PaginatedConsentResponse>(res)
    return body.data as PaginatedConsentResponse
  },
}
