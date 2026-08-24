const CART_TOKEN_KEY = 'htashop-cart-token'

export function getCartToken(): string {
  try {
    const existing = localStorage.getItem(CART_TOKEN_KEY)
    if (existing) return existing

    const token =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    localStorage.setItem(CART_TOKEN_KEY, token)
    return token
  } catch {
    return `cart-${Date.now()}`
  }
}
