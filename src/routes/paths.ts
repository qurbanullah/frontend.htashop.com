/**
 * Route path constants — single source of truth.
 * Every `<Link>`, `navigate()`, and `<Route path>` references these.
 */
export const paths = {
  root: '/',
  home: '/',

  // Auth
  login: '/login',
  register: '/register',
  checkAccount: '/check-account',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Public (no auth guard, no redirect)
  verifyEmail: '/verify-email',

  // Public storefront
  products: '/products',

  // Legal / compliance
  policiesPrivacy: '/policies/privacy-policy',
  policiesTerms: '/policies/terms-of-use',
  policiesCookies: '/policies/cookies-policy',
  policiesRefund: '/policies/refund-policy',

  // Checkout
  checkout: '/checkout',
  orderConfirmation: '/orders',

  // Buyer account
  account: '/account',
  accountOrders: '/account/orders',
  accountOrderDetail: '/account/orders/:uuid',
  accountAddresses: '/account/addresses',
  accountProfile: '/account/profile',
  accountSecurity: '/account/security',
  accountPrivacy: '/account/privacy',
} as const
