/**
 * Brand colour handling.
 *
 * `--brand` defaults to sky-500 in index.css, and the whole `blue` palette plus
 * the semantic `primary`/`ring` tokens derive from it. Setting `--brand` here
 * (from `VITE_BRAND_COLOR`, or a tenant setting later) rebrands every CTA,
 * link, focus ring and input border at once. `--brand-ink` keeps text on a
 * filled CTA readable whatever hex is supplied.
 */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

const INK_DARK = '#0f172a'
const INK_LIGHT = '#ffffff'

export function isBrandHex(value: string | null | undefined): value is string {
  return typeof value === 'string' && HEX.test(value.trim())
}

function expand(hex: string): string {
  const value = hex.trim()

  if (value.length !== 4) {
    return value
  }

  return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
}

/** WCAG relative luminance, used only to choose readable ink on the brand fill. */
export function relativeLuminance(hex: string): number {
  const value = expand(hex)

  const channel = (start: number): number => {
    const raw = Number.parseInt(value.slice(start, start + 2), 16) / 255

    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** Dark ink for light brands (sky-500), white for dark ones. */
export function brandInk(hex: string): string {
  const luminance = relativeLuminance(hex)
  const dark = relativeLuminance(INK_DARK)

  const withWhite = 1.05 / (luminance + 0.05)
  const withDark = (Math.max(luminance, dark) + 0.05) / (Math.min(luminance, dark) + 0.05)

  return withWhite >= withDark ? INK_LIGHT : INK_DARK
}

/** Apply (or clear) the brand colour on the document root. */
export function applyBrandColor(primaryColor: string | null | undefined): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  if (!isBrandHex(primaryColor)) {
    root.style.removeProperty('--brand')
    root.style.removeProperty('--brand-ink')

    return
  }

  root.style.setProperty('--brand', expand(primaryColor))
  root.style.setProperty('--brand-ink', brandInk(primaryColor))
}
