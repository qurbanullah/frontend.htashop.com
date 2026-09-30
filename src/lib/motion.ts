/**
 * Motion helpers.
 *
 * `prefers-reduced-motion` is a medical accessibility setting, not a hint: an
 * animated scroll or transition can trigger nausea for vestibular disorders, so
 * every programmatic animation in the storefront asks here first.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** `'auto'` when the visitor has asked for reduced motion, `'smooth'` otherwise. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}
