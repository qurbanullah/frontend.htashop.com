import { LegalLayout } from '@/components/legal/LegalLayout'

const SECTIONS = [
  {
    heading: '1. Introduction',
    body: 'HTAShop ("we", "us", "our") is an e-commerce platform operated by High Tech Advancement Solutions (Private) Limited, CUIN 0321375, Pakistan. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website, create an account, browse products, place orders, or interact with our services. By using HTAShop, you agree to the practices described in this policy.',
  },
  {
    heading: '2. Information We Collect',
    body: 'We collect information you provide directly and information generated automatically when you use our platform:',
    bullets: [
      'Account information — name, email address, phone number, password (stored securely as a hash), and profile photo.',
      'Order information — billing and shipping addresses, order history, items purchased, amounts, and payment status.',
      'Payment information — we do NOT store full card numbers. Payment details are collected and processed by our PCI-DSS compliant payment partners (such as Safepay, JazzCash, Easypaisa, Upaisa, or Cash on Delivery). We may receive payment status, the last four digits, and a transaction reference.',
      'Communication — messages you send to our support team, review content you post, and responses to surveys.',
      'Technical data — IP address, device and browser type, operating system, referring URLs, pages visited, and timestamps.',
      'Cookies and similar technologies — see our Cookies Policy for details.',
    ],
  },
  {
    heading: '3. How We Use Your Information',
    bullets: [
      'To provide and operate the platform — create and manage your account, process orders, arrange delivery, and manage returns and refunds.',
      'To process payments and prevent fraud — verify transactions, detect suspicious activity, and share minimum necessary data with payment processors.',
      'To communicate with you — order updates, delivery notifications, support responses, and service announcements.',
      'To personalise your experience — recommend products, remember preferences, and improve search results.',
      'To improve our services — analyse usage, diagnose technical issues, and develop new features.',
      'To send marketing communications — only with your consent, and you may opt out at any time.',
      'To comply with legal obligations — tax, accounting, record-keeping, and regulatory requirements.',
    ],
  },
  {
    heading: '4. Legal Bases for Processing (GDPR)',
    body: 'If you are located in the European Economic Area (EEA) or the United Kingdom, we process your personal data on the following legal bases:',
    bullets: [
      'Performance of a contract — processing your orders, payments, and deliveries.',
      'Legitimate interests — fraud prevention, platform security, analytics, and service improvement, balanced against your rights.',
      'Consent — marketing communications, cookies (where required), and optional data you choose to share.',
      'Legal obligation — tax, accounting, and compliance with applicable law.',
    ],
  },
  {
    heading: '5. How We Share Your Information',
    body: 'We never sell your personal information. We share data only with trusted parties necessary to operate the platform:',
    bullets: [
      'Payment processors (Safepay, JazzCash, Easypaisa, Upaisa) — to authorise and settle your transactions under their own privacy and security standards.',
      'Logistics and delivery partners — name, address, and phone number needed to deliver your order.',
      'IT and hosting providers — infrastructure that stores data on our behalf under contractual safeguards.',
      'Professional advisers — legal, accounting, and audit services where required.',
      'Authorities — when required by law, regulation, or legal process, or to protect our rights and safety.',
    ],
  },
  {
    heading: '6. Data Retention',
    body: 'We retain personal information only as long as necessary for the purposes described in this policy and to meet legal obligations:',
    bullets: [
      'Account and order records — retained for as long as your account is active and for the period required by tax and accounting law (typically 5–7 years).',
      'Transaction records — retained to support refunds, disputes, and financial reporting.',
      'Marketing data — retained until you withdraw consent or unsubscribe.',
      'Deleted accounts — personal data is removed or anonymised after the applicable retention period, except where law requires otherwise.',
    ],
  },
  {
    heading: '7. International Data Transfers',
    body: 'Your data may be processed in countries other than your own, including Pakistan, where we operate, and the jurisdictions of our cloud and payment providers. Where transfers occur outside the EEA/UK, we rely on appropriate safeguards such as Standard Contractual Clauses, adequacy decisions, or equivalent lawful mechanisms, and we ensure our providers maintain similar protection.',
  },
  {
    heading: '8. Data Security',
    bullets: [
      'Encryption in transit (TLS/HTTPS) for all traffic to and from our platform.',
      'Payment card data handled exclusively by PCI-DSS compliant payment partners; card numbers never touch our servers.',
      'Hashed and salted passwords — we never store plain-text passwords.',
      'Access controls, monitoring, and regular security reviews of our infrastructure.',
      'We follow industry-standard practices and review our safeguards periodically, though no method of transmission or storage is 100% secure.',
    ],
  },
  {
    heading: '9. Your Rights',
    body: 'Depending on your jurisdiction (GDPR, UK GDPR, CCPA/CPRA, PDPA), you may have the following rights:',
    bullets: [
      'Access — request a copy of the personal data we hold about you.',
      'Correction — ask us to correct inaccurate or incomplete information.',
      'Deletion — request erasure of your data where no legal obligation prevents it.',
      'Restriction and objection — limit or object to certain processing, including direct marketing.',
      'Portability — receive your data in a structured, machine-readable format where applicable.',
      'Withdraw consent — at any time, for processing based on consent.',
      'Non-discrimination — we will not treat you differently for exercising your rights (CCPA/CPRA).',
    ],
  },
  {
    heading: '10. How to Exercise Your Rights',
    body: 'To exercise any of the above rights, contact us at privacy@htashop.com. We will verify your identity and respond within the timeframe required by applicable law (generally 30 days). You may also lodge a complaint with your local data protection authority.',
  },
  {
    heading: "11. Children's Privacy",
    body: 'HTAShop is not directed to children under 16, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal data, contact us and we will delete it promptly.',
  },
  {
    heading: '12. Third-Party Links',
    body: 'Our platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites, and we encourage you to review their policies before providing any information.',
  },
  {
    heading: '13. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated effective date. For significant changes affecting your rights, we will notify you by email or a prominent notice on the platform.',
  },
  {
    heading: '14. Contact Us',
    body: 'For questions or concerns about this Privacy Policy or our data practices, contact our Data Protection team:',
    bullets: [
      'Email: privacy@htashop.com',
      'Support: support@htashop.com',
      'High Tech Advancement Solutions (Private) Limited, Pakistan — CUIN 0321375',
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How HTAShop collects, uses, protects, and shares your personal information."
      updated="August 22, 2026"
      sections={SECTIONS}
    />
  )
}
