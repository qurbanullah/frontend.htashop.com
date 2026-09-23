import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

export type ContactSubjectKey =
  | 'order'
  | 'shipping'
  | 'returns'
  | 'product'
  | 'supplier'
  | 'general'

export interface ContactSubmitPayload {
  first_name: string
  last_name: string
  email: string
  phone?: string
  order_uuid?: string
  subject: ContactSubjectKey
  message: string
  consent: boolean
  source_page?: string
}

export interface ContactSubmission {
  id: number
  uuid: string
  status: string
}

/**
 * Submit a public "Contact Us" message.
 */
export const contactApi = {
  async submit(payload: ContactSubmitPayload): Promise<ContactSubmission> {
    const res = await api.post('contact', {
      json: payload,
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<ContactSubmission>(res)
    return body.data as ContactSubmission
  },
}
