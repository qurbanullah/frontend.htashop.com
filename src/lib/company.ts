/**
 * Canonical company and contact details.
 *
 * These appear in the footer, the contact and feedback pages, and every
 * legal/policy page. Keeping them here means a change is made once — the
 * previous hard-coded placeholder number had drifted into eight different files.
 */
const PHONE_INTL = '+924235252579'

export const COMPANY = {
  name: 'High Tech Advancement Solutions (Private) Limited',
  cuin: '0321375',
  address: {
    street: '263 Nishtar Block',
    locality: 'Allama Iqbal Town',
    city: 'Lahore',
    postalCode: '54570',
    region: 'Punjab',
    country: 'Pakistan',
  },
  /** Official landline, formatted for display. */
  phoneDisplay: '042 35252579',
  /** The same number in internationally dialable form. */
  phoneIntl: PHONE_INTL,
  phoneHref: `tel:${PHONE_INTL}`,
  email: 'support@htashop.com',
  salesEmail: 'sales@htashop.com',
  privacyEmail: 'privacy@htashop.com',
} as const

/** Single-line postal address, e.g. for footers and policy contact sections. */
export const COMPANY_ADDRESS_LINE = [
  COMPANY.address.street,
  COMPANY.address.locality,
  COMPANY.address.city,
  COMPANY.address.postalCode,
  COMPANY.address.region,
  COMPANY.address.country,
].join(', ')
