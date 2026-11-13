import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'

/**
 * Product / bulk quote requests.
 *
 * The API requires the buyer's contact and company details plus a message; the
 * optional `industry_id`, `requirements` and `quotable_*` fields let a request
 * carry the product (and variant/quantity) it was raised from.
 */
export interface QuoteRequestPayload {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  business_email?: string | null
  organization: string
  department?: string | null
  job_title: string
  company_size?: string | null
  industry?: string | null
  industry_id?: number | null
  country: string
  state?: string | null
  city: string
  postal_code: string
  application?: string | null
  message: string
  requirements?: Record<string, unknown> | null
  quotable_type?: string | null
  quotable_id?: number | null
  source_page?: string | null
}

export interface QuoteRequestResult {
  uuid: string
  reference_number: string
}

export interface PortalQuoteItem {
  name: string
  sku: string | null
  quantity: number
  unit_price: number
  line_total: number
}

export interface PortalQuoteResponse {
  uuid: string
  revision: number
  status: string
  status_label: string
  subject: string
  message: string
  terms: string | null
  currency: string
  subtotal: number | null
  discount_amount: number | null
  tax_amount: number | null
  shipping_amount: number | null
  total_amount: number | null
  expires_at: string | null
  sent_at: string | null
  incoterm: string | null
  incoterm_label: string | null
  incoterm_location: string | null
  payment_terms_label: string | null
  warranty_months: number | null
  shipping_method_label: string | null
  country_of_origin: string | null
  hs_code: string | null
  lead_time_days: number | null
  estimated_ship_date: string | null
  port_of_loading: string | null
  port_of_discharge: string | null
  partial_shipment_allowed: boolean
  package_count: number | null
  gross_weight_kg: number | null
  net_weight_kg: number | null
  package_dimensions: string | null
  items: PortalQuoteItem[]
}

export interface PortalQuote {
  uuid: string
  reference_number: string
  quote_number: string | null
  status: string
  status_label: string
  customer_name: string
  organization: string
  created_at: string | null
  expires_at: string | null
  currency: string | null
  latest_response: PortalQuoteResponse | null
  can_respond: boolean
  actions: {
    accept: PortalSignature | null
    decline: PortalSignature | null
  }
  pdf_url: string | null
}

export interface PortalSignature {
  expires: string
  signature: string
}

export const quoteApi = {
  async submit(payload: QuoteRequestPayload): Promise<QuoteRequestResult> {
    const res = await api.post('quotes', {
      json: payload,
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<QuoteRequestResult>(res)
    return body.data as QuoteRequestResult
  },

  /** Signed buyer portal. The signature is forwarded to the same API route. */
  async portal(uuid: string, signature: PortalSignature): Promise<PortalQuote> {
    const res = await api.get(`quotes/${uuid}/portal`, {
      searchParams: { expires: signature.expires, signature: signature.signature },
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<PortalQuote>(res)
    return body.data as PortalQuote
  },

  async accept(uuid: string, signature: PortalSignature): Promise<{ status: string }> {
    const res = await api.post(`quotes/${uuid}/accept`, {
      searchParams: { expires: signature.expires, signature: signature.signature },
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<{ status: string }>(res)
    return body.data as { status: string }
  },

  async decline(
    uuid: string,
    signature: PortalSignature,
    reason?: string
  ): Promise<{ status: string }> {
    const res = await api.post(`quotes/${uuid}/decline`, {
      searchParams: { expires: signature.expires, signature: signature.signature },
      json: { reason: reason?.trim() || null },
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<{ status: string }>(res)
    return body.data as { status: string }
  },
}
