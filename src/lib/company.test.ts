import { describe, expect, it } from 'vitest'
import { COMPANY, COMPANY_ADDRESS_LINE } from '@/lib/company'

describe('company details', () => {
  it('keeps the displayed number and the dialable link in sync', () => {
    // "042 35252579" must dial as +92 42 35252579.
    const digits = COMPANY.phoneDisplay.replace(/\D/g, '')

    expect(digits).toHaveLength(11)
    expect(COMPANY.phoneHref).toBe(`tel:+92${digits.slice(1)}`)
  })

  it('includes every address part in the single-line address', () => {
    for (const part of Object.values(COMPANY.address)) {
      expect(COMPANY_ADDRESS_LINE).toContain(part)
    }
  })

  it('points the support and sales addresses at htashop.com', () => {
    expect(COMPANY.email).toMatch(/@htashop\.com$/)
    expect(COMPANY.salesEmail).toMatch(/@htashop\.com$/)
    expect(COMPANY.privacyEmail).toMatch(/@htashop\.com$/)
  })
})
