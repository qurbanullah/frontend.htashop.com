import { useQuery } from '@tanstack/react-query'
import { checkoutApi } from '@/api/checkout'

const CHECKOUT_STATUS_KEY = ['checkout-status'] as const

export interface CheckoutAvailability {
  enabled: boolean
  message: string
  isLoading: boolean
}

/**
 * Storefront-side view of the API's checkout master switch.
 *
 * On a transient status failure we fail open: the checkout endpoints are
 * themselves fail-closed, so showing the CTA is safe and a status blip should
 * not hide checkout from every customer.
 */
export function useCheckoutStatus(): CheckoutAvailability {
  const query = useQuery({
    queryKey: CHECKOUT_STATUS_KEY,
    queryFn: () => checkoutApi.status(),
    staleTime: 60 * 1000,
  })

  return {
    enabled: query.data?.enabled ?? true,
    message: query.data?.message ?? '',
    isLoading: query.isLoading,
  }
}
