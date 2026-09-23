/**
 * Direction helpers for right-to-left layouts (Urdu).
 *
 * `i18n/config.ts` keeps `<html dir>` in sync with the active language, so the
 * document attribute is the single source of truth for UI-direction decisions
 * that Tailwind's logical utilities (`ps-`, `end-`, `start-`) cannot express —
 * horizontal scroll deltas, slide-in gestures and icon mirroring.
 */

/** True when the document is currently rendered right-to-left. */
export function isRtlDocument(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.getAttribute('dir') === 'rtl'
}

/** `1` when reading forwards is left-to-right, `-1` when it is right-to-left. */
export function readingDirectionSign(): 1 | -1 {
  return isRtlDocument() ? -1 : 1
}

/**
 * Horizontal scroll offset for a container. `scrollLeft` runs negative in RTL,
 * so callers that only care about "how far along" must normalise it first.
 */
export function scrollOffset(el: HTMLElement): number {
  return Math.abs(el.scrollLeft)
}

/**
 * Convert a logical scroll delta (positive = forwards in the reading
 * direction) into the physical delta `scrollBy` expects for `el`.
 */
export function toPhysicalScrollDelta(el: HTMLElement, delta: number): number {
  if (typeof window === 'undefined') return delta
  return getComputedStyle(el).direction === 'rtl' ? -delta : delta
}
