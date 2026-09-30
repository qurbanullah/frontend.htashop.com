import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

export type DevicePlatform = 'android' | 'ios'

export interface RegisterDevicePayload {
  token: string
  platform: DevicePlatform
  /** Stable, install-scoped id — lets the API retire a replaced push token. */
  device_id?: string | null
  app_version?: string | null
}

/**
 * Push destinations for the signed-in account.
 *
 * A token is owned by the account that registered it, so the app registers
 * after sign-in and detaches on sign-out — otherwise the previous user's order
 * notifications would keep reaching the device.
 */
export const devicesApi = {
  async register(payload: RegisterDevicePayload): Promise<void> {
    const res = await api.post('devices', { json: payload, throwHttpErrors: false })
    await parseApiResponse(res)
  },

  async unregister(token: string): Promise<void> {
    const res = await api.delete('devices', { json: { token }, throwHttpErrors: false })
    await parseApiResponse(res)
  },
}
