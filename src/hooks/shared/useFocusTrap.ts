import { type RefObject, useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * The element focus should wrap to, or null when the Tab should proceed normally.
 * Pure and outside the hook so the hook body stays a simple wiring function.
 */
function wrapTarget(
  focusable: HTMLElement[],
  shiftKey: boolean,
  active: Element | null
): HTMLElement | null {
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last || first === last) return null
  if (shiftKey && active === first) return last
  if (!shiftKey && active === last) return first
  return null
}

/**
 * Keeps Tab focus inside `containerRef` while `enabled`.
 *
 * The hand-rolled modal/drawer implementations block page scrolling but do not
 * make the rest of the page inert, so without a trap focus walks out into the
 * content behind the overlay.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      const target = wrapTarget(focusable, event.shiftKey, document.activeElement)
      if (!target) return

      event.preventDefault()
      target.focus()
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [containerRef, enabled])
}
