import { LegalLayout } from '@/components/legal/LegalLayout'

const SECTIONS = [
  {
    heading: '1. Introduction',
    body: 'This website and the HTAShop platform (the "Service") are owned and operated by High Tech Advancement Solutions (Private) Limited, CUIN 0321375 (hereinafter "HTAShop", "we", "us" and "our"). Our principal place of business is in Pakistan. We offer this website, including all information, tools, products, and services available from this website, to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.',
    bullets: [
      'If you have any problems placing your order on our website, or require support after placing an order, contact us at support@htashop.com or +92 300 0000000.',
    ],
  },
  {
    heading: '2. Applicability and Updates',
    body: 'By visiting our site and/or purchasing something from us, you engage in our "Service" and agree to be bound by these Terms and Conditions, including those additional terms and policies referenced herein and/or available by hyperlink (such as our Privacy Policy, Cookies Policy, and Shipping, Cancellations and Return/Refund Policy). These Terms apply to all users of the site, including without limitation browsers, vendors, customers, merchants, and contributors of content.',
    bullets: [
      'You represent that you are of legal age to form a binding contract and are not a person barred from receiving products and services under the laws of Pakistan or other applicable jurisdiction.',
      'We may update these Terms from time to time. Each time you place an order on our website, you will be agreeing to the latest version of these Terms.',
    ],
  },
  {
    heading: '3. Accounts and Registration',
    body: 'When you register, you agree to provide accurate, current, and complete information and to keep it up to date. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately at support@htashop.com if you suspect unauthorised use of your account.',
  },
  {
    heading: '4. Orders and Acceptance',
    body: 'All orders are subject to availability and acceptance. A contract for the sale of goods is formed only when we confirm your order. We reserve the right to not process an order that you place on our website, usually for the following reasons:',
    bullets: [
      'We no longer hold stock of the goods or services that you ordered.',
      'We are unable to ship goods to your location.',
      'The goods or services that you have ordered are no longer available.',
      'Any reason outside of our control.',
      'We may also decline or cancel orders due to pricing errors, suspected fraud, or payment failure.',
    ],
  },
  {
    heading: '5. Pricing and Payment',
    bullets: [
      'Prices are displayed in the applicable currency and may change at any time without notice. The price at the time you place an order is the price you pay.',
      'We accept Cash on Delivery (COD) and, where available, online payment methods such as Safepay, JazzCash, Easypaisa, and Upaisa.',
      'Payment card processing is performed by PCI-DSS compliant payment partners. We never store your full card details.',
      'All payments must be authorised and cleared before orders are dispatched. Failed payments may result in order cancellation.',
      'You are responsible for applicable taxes, duties, or fees charged at checkout or upon delivery.',
    ],
  },
  {
    heading: '6. Shipping, Returns and Refunds',
    body: 'Delivery timelines, cancellations, returns, exchanges, and refunds are governed by our Shipping, Cancellations and Return/Refund Policy, which forms part of these Terms. Please review it before making a purchase.',
  },
  {
    heading: '7. Terms of Usage',
    body: 'You are prohibited from using this website or its content:',
    bullets: [
      'For any unlawful purpose.',
      'To solicit others to perform or participate in any unlawful acts.',
      'To violate any international, federal, provincial, or state laws, regulations, and rules.',
      'To infringe upon or violate our intellectual property rights or the intellectual property rights of others.',
      'To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability.',
      'To submit false or misleading information, including fake reviews or chargeback abuse.',
      'To upload or transmit viruses or any other type of malicious code that may affect the functionality or operation of the Service, or interfere with or circumvent the security features of our Service, any related website, other websites, or the internet.',
      'To collect or track the personal information of others, or to spam, phish, pharm, pretext, spider, crawl, or scrape.',
      'For any obscene or immoral purpose.',
    ],
  },
  {
    heading: '8. Intellectual Property',
    body: 'This website and its related software and content (including images and designs) are the intellectual property of, and exclusively owned by, HTAShop. The structure, organization, and code of the website and its related software contain valuable trade secrets and confidential information of HTAShop. Except as expressly stated herein, these Terms do not grant you any intellectual property rights whatsoever in the website and its related software, and all rights are reserved by HTAShop. Product names, trademarks, and logos of third parties remain the property of their respective owners.',
  },
  {
    heading: '9. User Content and Reviews',
    body: 'You retain ownership of content you post (such as reviews). By posting, you grant us a non-exclusive, royalty-free, worldwide licence to use, reproduce, and display that content to operate and promote the platform. You confirm your content is accurate and does not violate these Terms or the rights of others. We may remove content that breaches these Terms.',
  },
  {
    heading: '10. Indemnity and Limitation of Liability',
    bullets: [
      "You agree to indemnify, defend, and hold harmless HTAShop and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, interns, and employees from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of your breach of these Terms or the documents they incorporate by reference, or your violation of any law or the rights of a third party.",
      'Neither we nor any third party provides any warranty or guarantee as to the accuracy, timeliness, performance, completeness, or suitability of the information and materials found or offered on this website for any particular purpose. Such information and materials may contain inaccuracies or errors, and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.',
      'Your use of any information or materials on this website is entirely at your own risk. It is your responsibility to ensure that any products, services, or information available through this website meet your specific requirements.',
      'To the extent permitted by law, we disclaim all warranties, whether express or implied, including the implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.',
      'Nothing in these Terms limits liability that cannot be limited under applicable law, including for fraud, gross negligence, or death or personal injury caused by negligence.',
    ],
  },
  {
    heading: '11. Termination',
    body: 'We may immediately change or terminate your access to our products, services, and this website, or any online membership(s) with us, with or without notice, at any time, without liability to you, any other user, or any third party. We reserve the right to terminate your access if, without limitation, you have:',
    bullets: [
      'Provided us with false or misleading registration information.',
      'Interfered with other users or the administration of our services or websites.',
      'Been requested to do so by law enforcement or other governmental authorities.',
      'Otherwise violated these Terms.',
      'Outstanding obligations (such as unpaid orders) survive termination.',
    ],
  },
  {
    heading: '12. Severability and Waiver',
    body: 'If any portion of these Terms is found to be unenforceable, the unenforceable portion will be deemed amended to the minimum extent necessary to make it enforceable, and if it cannot be made enforceable, it will be severed and the remaining portion will remain in full force and effect. If we fail to enforce any of these Terms, it will not be considered a waiver. Any amendment to or waiver of these Terms must be made in writing and signed by us.',
  },
  {
    heading: '13. Governing Law',
    body: 'These Terms are governed by the laws of the Islamic Republic of Pakistan, and you agree that the competent courts of Pakistan (including any consumer court) will have exclusive jurisdiction in any dispute that you have with us.',
  },
  {
    heading: '14. Contact',
    body: 'Questions about these Terms? Contact us at support@htashop.com or +92 300 0000000, or write to High Tech Advancement Solutions (Private) Limited, Pakistan — CUIN 0321375.',
  },
]

export default function TermsOfUsePage() {
  return (
    <LegalLayout
      title="Terms of Use"
      description="The terms and conditions that govern your use of the HTAShop platform and purchases."
      updated="August 22, 2026"
      sections={SECTIONS}
    />
  )
}
