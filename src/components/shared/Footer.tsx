import {
  CheckCircle2,
  CreditCard,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { newsletterApi } from '@/api/newsletter'
import { Logo } from '@/components/shared/Logo'
import { isApiError } from '@/lib/api-response'
import { COMPANY, COMPANY_ADDRESS_LINE } from '@/lib/company'
import { paths } from '@/routes/paths'
import { useConsentStore } from '@/stores/consent'

type Translate = (key: string) => string

interface FooterLink {
  label: string
  to?: string
  href?: string
  action?: () => void
}

const HTASOL_URL = 'https://htasol.com'

function getShopLinks(t: Translate): FooterLink[] {
  return [
    { label: t('footer.all_products'), to: paths.products },
    { label: t('footer.new_arrivals'), to: `${paths.products}?sort=newest` },
    { label: t('footer.best_sellers'), to: `${paths.products}?sort=best_sellers` },
    { label: t('footer.trending'), to: `${paths.products}?sort=trending` },
  ]
}

function getCompanyLinks(t: Translate): FooterLink[] {
  return [
    { label: t('footer.blog'), to: paths.blogs },
    { label: t('footer.news'), to: paths.news },
    { label: t('footer.events'), to: paths.events },
    { label: t('footer.become_supplier'), to: paths.register },
  ]
}

function getSupportLinks(t: Translate): FooterLink[] {
  return [
    { label: t('footer.contact_us'), to: paths.contact },
    { label: t('footer.feedback'), to: paths.feedback },
    { label: t('footer.track_order'), to: paths.accountOrders },
    { label: t('footer.returns_refunds'), to: paths.policiesRefund },
    { label: t('footer.email_support'), href: `mailto:${COMPANY.email}` },
  ]
}

function getLegalLinks(t: Translate): FooterLink[] {
  return [
    { label: t('footer.terms_of_use'), to: paths.policiesTerms },
    { label: t('footer.privacy_policy'), to: paths.policiesPrivacy },
    { label: t('footer.refund_policy'), to: paths.policiesRefund },
    { label: t('footer.cookies_policy'), to: paths.policiesCookies },
    {
      label: t('footer.cookie_settings'),
      action: () => useConsentStore.getState().openSettings(),
    },
  ]
}

function getTrustItems(t: Translate) {
  return [
    {
      icon: ShieldCheck,
      title: t('footer.trust_verified_suppliers'),
      description: t('footer.trust_verified_suppliers_desc'),
    },
    {
      icon: Truck,
      title: t('footer.trust_fast_delivery'),
      description: t('footer.trust_fast_delivery_desc'),
    },
    {
      icon: CreditCard,
      title: t('footer.trust_secure_payments'),
      description: t('footer.trust_secure_payments_desc'),
    },
    {
      icon: Headphones,
      title: t('footer.trust_support'),
      description: t('footer.trust_support_desc'),
    },
  ]
}

/** Brand names — deliberately not translated. */
const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/htashop',
    path: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.03 3.66 9.2 8.44 9.95v-7.04H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7.04c4.78-.74 8.44-4.92 8.44-9.95Z',
  },
  {
    label: 'X (Twitter)',
    href: 'https://twitter.com/htashop',
    path: 'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/htashop',
    path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.35 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.35-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9c-.42-.42-.68-.82-.9-1.38-.16-.42-.35-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.35 2.23-.41 1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.15a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/htashop',
    path: 'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/htashop',
    path: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z',
  },
]

const CONTACT = [
  { icon: MapPin, label: COMPANY_ADDRESS_LINE },
  { icon: Phone, label: COMPANY.phoneDisplay, href: COMPANY.phoneHref },
  { icon: Mail, label: COMPANY.salesEmail, href: `mailto:${COMPANY.salesEmail}` },
]

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    'text-sm text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-white'
  if (link.action) {
    return (
      <button type="button" onClick={link.action} className={className}>
        {link.label}
      </button>
    )
  }
  if (link.to) {
    return (
      <Link to={link.to} className={className}>
        {link.label}
      </Link>
    )
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
    </a>
  )
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider dark:text-white">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeError, setSubscribeError] = useState<string | null>(null)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!value) return

    setSubscribeError(null)
    setSubscribing(true)
    try {
      await newsletterApi.subscribe({
        email: value,
        consent: true,
        source_page: window.location.href,
      })
      setSubscribed(true)
      setEmail('')
    } catch (error) {
      setSubscribeError(
        isApiError(error) && error.message ? error.message : t('footer.newsletter_error')
      )
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <footer className="border-gray-200 border-t bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
      {/* Email signup band */}
      <div className="border-gray-200 border-b bg-gradient-to-r from-blue-50 via-white to-cyan-50 dark:border-gray-800/80 dark:from-blue-950/50 dark:via-gray-950 dark:to-cyan-950/40">
        <div className="shell mx-auto flex flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="font-bold text-gray-900 text-xl sm:text-2xl dark:text-white">
              {t('footer.newsletter_title')}
            </h2>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {t('footer.newsletter_description')}
            </p>
          </div>

          {subscribed ? (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3 font-medium text-green-700 text-sm dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {t('footer.newsletter_success')}
            </div>
          ) : (
            <div className="w-full max-w-md">
              <form onSubmit={handleSubscribe} className="flex w-full gap-2">
                <label htmlFor="subscribe-email" className="sr-only">
                  {t('footer.newsletter_email_label')}
                </label>
                <input
                  id="subscribe-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.newsletter_placeholder')}
                  className="h-11 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-gray-900 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {subscribing ? t('footer.newsletter_submitting') : t('footer.newsletter_submit')}
                </button>
              </form>
              {subscribeError && (
                <p className="mt-2 text-red-600 text-xs dark:text-red-400">{subscribeError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main columns */}
      <div className="shell mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link to={paths.home} aria-label={t('shell.home_link')}>
              <Logo width={60} />
            </Link>
            <p className="mt-4 max-w-md text-gray-500 text-sm leading-relaxed dark:text-gray-400">
              {t('footer.brand_description')}
            </p>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {getTrustItems(t).map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/60"
                >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-gray-900 text-xs dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-blue-600 hover:bg-blue-600 hover:text-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d={social.path} />
                  </svg>
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-2">
            <FooterColumn title={t('footer.column_shop')} links={getShopLinks(t)} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title={t('footer.column_company')} links={getCompanyLinks(t)} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title={t('footer.column_support')} links={getSupportLinks(t)} />
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider dark:text-white">
              {t('footer.column_contact')}
            </h3>
            <ul className="mt-4 space-y-3">
              {CONTACT.map((item) => (
                <li
                  key={item.label}
                  className="flex items-start gap-2.5 text-gray-500 text-sm dark:text-gray-400"
                >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  {item.href ? (
                    <a
                      href={item.href}
                      className="transition-colors hover:text-blue-600 dark:hover:text-white"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Legal strip + bottom bar */}
      <div className="border-gray-200 border-t dark:border-gray-800/80">
        <div className="shell mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {getLegalLinks(t).map((link) => (
              <li key={link.label}>
                <FooterLinkItem link={link} />
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 border-gray-100 border-t pt-4 lg:flex-row lg:items-center lg:justify-between dark:border-gray-800/60">
            <p className="text-gray-500 text-xs">
              <Trans
                i18nKey="footer.copyright_line"
                values={{ year, company: COMPANY.name, cuin: COMPANY.cuin }}
                components={{
                  companyLink: (
                    // Children are injected by i18next from the translation string.
                    // biome-ignore lint/a11y/useAnchorContent: anchor text comes from the translation
                    <a
                      href={HTASOL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                    />
                  ),
                }}
              />
            </p>
            <p className="text-gray-500 text-xs">{t('footer.secure_shopping')}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
