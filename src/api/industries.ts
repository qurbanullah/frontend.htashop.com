import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

export interface Industry {
  id: number
  code: string
  name: string
}

export const industriesApi = {
  /** Active company industries for buyer-facing selects (quote / BOM forms). */
  async list(): Promise<Industry[]> {
    const res = await api.get('industries')
    const body = await parseApiResponse<Industry[]>(res)
    return (body.data as Industry[]) ?? []
  },
}
