import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

/**
 * Payment gateway endpoints.
 *
 * The list of methods is server-driven: a gateway appears here only when it is
 * switched on *and* configured (see `api/docs/PAYMENTS.md`), so the storefront
 * must never hard-code which methods exist. When every hosted gateway is
 * unavailable the API still returns Cash on Delivery, so the list is never
 * empty and checkout always has something to offer.
 */

export interface PaymentMethodOption {
  method: string
  label: string
  /** Hosted gateways send the customer away to pay; COD does not. */
  requires_redirect: boolean
}

export interface PaymentTransaction {
  uuid: string
  type: string
  status: string
  amount: number
  currency: string
  created_at: string | null
}

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded'

export interface PaymentDetail {
  uuid: string
  order_uuid: string | null
  order_number: string | null
  payment_method: string
  status: PaymentStatus
  amount: number
  currency: string
  transaction_reference: string | null
  transactions: PaymentTransaction[]
}

export const paymentsApi = {
  async methods(currency?: string): Promise<PaymentMethodOption[]> {
    const res = await api.get('payments/methods', {
      searchParams: currency ? { currency } : undefined,
      throwHttpErrors: false,
    })

    const body = await parseApiResponse<{ methods: PaymentMethodOption[] }>(res)

    return body.data?.methods ?? []
  },

  /**
   * Local payment state. `refresh` asks the gateway for the authoritative
   * status first — slower, and the right call when a webhook may have been
   * missed (i.e. on every return from a hosted checkout).
   */
  async get(uuid: string, options: { refresh?: boolean } = {}): Promise<PaymentDetail> {
    const res = await api.get(`payments/${encodeURIComponent(uuid)}`, {
      searchParams: options.refresh ? { refresh: 1 } : undefined,
      throwHttpErrors: false,
    })

    const body = await parseApiResponse<PaymentDetail>(res)

    return body.data as PaymentDetail
  },
}
