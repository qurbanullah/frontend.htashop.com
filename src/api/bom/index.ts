import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

/**
 * BOM / kit sourcing — submit a bill of materials and get a landed-cost quote.
 */

export interface BomLineInput {
  part_name: string
  part_number?: string | null
  specification?: string | null
  quantity: number
  unit?: string | null
  target_unit_price?: number | null
  source_url?: string | null
  notes?: string | null
}

export interface BomRequestPayload {
  name: string
  email: string
  phone?: string | null
  company?: string | null
  title?: string | null
  notes?: string | null
  lines: BomLineInput[]
}

export interface BomRequestSubmission {
  uuid: string
  reference_number: string
  status: string
}

export interface BomRequestStatusResult {
  uuid: string
  reference_number: string
  status: string
  created_at: string
}

export const bomApi = {
  async submit(payload: BomRequestPayload): Promise<BomRequestSubmission> {
    const res = await api.post('bom-requests', {
      json: payload,
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<BomRequestSubmission>(res)
    return body.data as BomRequestSubmission
  },

  async get(uuid: string): Promise<BomRequestStatusResult> {
    const res = await api.get(`bom-requests/${encodeURIComponent(uuid)}`, {
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<BomRequestStatusResult>(res)
    return body.data as BomRequestStatusResult
  },
}
