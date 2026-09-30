import { useEffect, useState } from 'react'

/**
 * A value that trails the input by `delayMs`.
 *
 * Used to keep a keystroke-per-request pattern out of the API: the coupon field
 * types freely, and only the settled value is sent for a quote.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)

    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
