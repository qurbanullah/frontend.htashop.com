import { beforeEach, describe, expect, it } from 'vitest'
import { applyBrandColor, brandInk, isBrandHex, relativeLuminance } from '@/lib/brand'

describe('brand colour', () => {
  it('accepts 3- and 6-digit hex values only', () => {
    expect(isBrandHex('#0ea5e9')).toBe(true)
    expect(isBrandHex('#abc')).toBe(true)
    expect(isBrandHex('0ea5e9')).toBe(false)
    expect(isBrandHex('sky')).toBe(false)
    expect(isBrandHex(null)).toBe(false)
  })

  it('picks dark ink for the light brand colour', () => {
    expect(brandInk('#0ea5e9')).toBe('#0f172a')
  })

  it('picks white ink for a dark brand colour', () => {
    expect(brandInk('#131921')).toBe('#ffffff')
    expect(brandInk('#7c2d12')).toBe('#ffffff')
  })

  it('exposes relative luminance for contrast decisions', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 2)
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 2)
    expect(relativeLuminance('#0ea5e9')).toBeGreaterThan(0.2)
  })
})

describe('applyBrandColor', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--brand')
    document.documentElement.style.removeProperty('--brand-ink')
  })

  it('sets the brand and ink variables', () => {
    applyBrandColor('#1e3a8a')

    expect(document.documentElement.style.getPropertyValue('--brand')).toBe('#1e3a8a')
    expect(document.documentElement.style.getPropertyValue('--brand-ink')).toBe('#ffffff')
  })

  it('expands shorthand hex', () => {
    applyBrandColor('#0af')

    expect(document.documentElement.style.getPropertyValue('--brand')).toBe('#00aaff')
  })

  it('clears the override for an invalid or missing colour', () => {
    applyBrandColor('#1e3a8a')
    applyBrandColor(undefined)

    expect(document.documentElement.style.getPropertyValue('--brand')).toBe('')
    expect(document.documentElement.style.getPropertyValue('--brand-ink')).toBe('')
  })
})
