import { LegalLayout } from '@/components/legal/LegalLayout'

const SECTIONS = [
  {
    heading: '1. What Are Cookies?',
    body: 'Cookies are small text files stored on your device (computer, tablet, or phone) when you visit a website. They allow the website to recognise your device, remember your preferences, and understand how you use the site. Similar technologies — such as local storage, pixels, and web beacons — are used for the same purposes and are covered by this policy.',
  },
  {
    heading: '2. How We Use Cookies',
    body: 'We use cookies and similar technologies to keep the platform secure, make it work properly, remember your choices, and improve your experience:',
    bullets: [
      'Essential cookies — required for core functions such as logging in, keeping your shopping cart, and completing checkout. The platform cannot function without them.',
      'Preference cookies — remember your choices such as language, currency, and display preferences.',
      'Analytics cookies — help us understand how visitors use the site (pages visited, time on site, errors) so we can improve performance and usability.',
      'Marketing cookies — used (where consent is given) to show relevant content and measure the effectiveness of our campaigns.',
    ],
  },
  {
    heading: '3. Cookies We Use',
    body: 'The specific cookies we may use include:',
    bullets: [
      'Authentication and session cookies — keep you signed in and maintain your cart session (e.g., a cart token stored in your browser).',
      'Preference cookies — store settings like your chosen currency and category navigation preferences.',
      'Analytics cookies — provided by third-party analytics services to measure traffic and usage patterns in aggregate.',
      'Payment-related cookies — set by our payment partners (e.g., Safepay, JazzCash, Easypaisa, Upaisa) when you use online payment methods, subject to their own policies.',
    ],
  },
  {
    heading: '4. Third-Party Cookies',
    body: 'Some cookies are set by third-party services we integrate with:',
    bullets: [
      'Analytics providers — to measure and report on site usage without identifying individual users.',
      "Payment gateways — to complete and secure online transactions; these are governed by the provider's own cookie and privacy policies.",
      'Advertising and social platforms — only where you have consented to marketing cookies.',
    ],
  },
  {
    heading: '5. Managing and Disabling Cookies',
    body: 'You can control cookies through your browser settings. Most browsers let you view, block, or delete cookies, and choose whether to accept them site by site:',
    bullets: [
      'Browser settings — use the help menu of Chrome, Firefox, Safari, Edge, or your mobile browser to manage cookie preferences.',
      'Blocking all cookies — this may prevent essential features from working, including signing in, maintaining your cart, and completing checkout.',
      'Deleting cookies — removing cookies will sign you out and reset preferences; essential cookies will be recreated when you use the platform again.',
      'Where required by law, we will ask for your consent before placing non-essential cookies and you may withdraw consent at any time.',
    ],
  },
  {
    heading: '6. Consent and Legal Basis',
    body: 'Strictly necessary cookies do not require consent because they are essential to provide the service you request. Analytics and marketing cookies are placed with your consent where required by applicable law (such as the GDPR or the UK PECR). You can change your preferences at any time through your browser settings or our consent prompt.',
  },
  {
    heading: '7. Updates to This Policy',
    body: 'We may update this Cookies Policy as our services and the technologies we use evolve. Any changes will be posted on this page with an updated effective date.',
  },
  {
    heading: '8. Contact',
    body: 'If you have questions about our use of cookies, contact us at privacy@htashop.com or support@htashop.com.',
  },
]

export default function CookiesPolicyPage() {
  return (
    <LegalLayout
      title="Cookies Policy"
      description="How HTAShop uses cookies and similar technologies to keep the platform secure and improve your experience."
      updated="August 22, 2026"
      sections={SECTIONS}
    />
  )
}
