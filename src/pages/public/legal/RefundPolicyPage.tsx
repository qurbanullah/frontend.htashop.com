import { LegalLayout } from '@/components/legal/LegalLayout'

const SECTIONS = [
  {
    heading: '1. Overview',
    body: 'This Shipping, Cancellations and Return/Refund Policy explains how we deliver orders and how complaints, cancellations, returns, exchanges, and refunds are handled. It forms part of our Terms of Use. By placing an order on HTAShop, you agree to the terms of this policy.',
  },
  {
    heading: '2. Domestic Shipping',
    bullets: [
      'We deliver orders within Pakistan using reputable courier companies and, where applicable, our own riders.',
      'We will deliver your order to the address you provide when placing the order, typically within 3–7 business days of dispatch.',
      'This timeline is tentative only. We shall not be liable for any delays arising out of events outside our reasonable control, including weather, courier, or customs circumstances.',
    ],
  },
  {
    heading: '3. International Shipping',
    bullets: [
      'Where we offer international delivery, we use reputable international courier companies.',
      'Delivery may take longer than domestic shipping due to circumstances outside our control, and we shall not be held liable for such delays.',
      'You may be required to pay customs duties, taxes, or other charges upon receipt of goods shipped from Pakistan. These charges are your responsibility.',
    ],
  },
  {
    heading: '4. Complaints',
    body: 'For any complaint or query relating to our website, products, or service, contact us at support@htashop.com or +92 300 0000000. We will use our best endeavours to respond to your complaint or query within 2 business days of receipt.',
    bullets: [
      'In case of a complaint for a defective or incorrect product, you must share proper and complete evidence of receiving an incorrect or defective product — such as receipts, pictures, and videos — so we can resolve the issue quickly.',
    ],
  },
  {
    heading: '5. Cancellations',
    body: 'You may cancel any order within 24 hours of placement. After this period, no cancellation requests shall be entertained, except where required by applicable consumer law. You can request a cancellation from your order history or by contacting support@htashop.com.',
  },
  {
    heading: '6. Returns, Exchanges and Refunds — Eligibility',
    body: 'We operate a no return, exchange, and no refund policy except where the goods you receive are different from what you ordered on our website, or are defective or damaged.',
    bullets: [
      'Defective or damaged items — the product arrived broken, faulty, or not working as described.',
      'Wrong item — you received a product, variant, or quantity different from your order.',
      'Where required by applicable consumer law, we honour the statutory right to withdraw from the purchase within the legally prescribed period.',
    ],
  },
  {
    heading: '7. Conditions for Returns',
    bullets: [
      'We only accept returns of goods within 7 days of you receiving your order.',
      'Goods returned to us must be in a condition that they can be sold again — unused, with original packaging, manuals, and accessories included.',
      'Returns must be sent by courier to the address provided by our support team after your return request is approved.',
      'You will be responsible for paying your own shipping costs for returning goods. Shipping costs are non-refundable.',
    ],
  },
  {
    heading: '8. Exchanges and Store Credit',
    body: 'Instead of a refund, we may provide you with store credit so that you can exchange the returned goods for any other item of the same value from our website. Store credit is issued to your HTAShop account and can be applied at checkout.',
  },
  {
    heading: '9. Refund Processing',
    bullets: [
      'Once we receive and inspect the returned goods and confirm they are in a saleable condition, we will credit your refund within 7–14 business days of receipt of the goods.',
      'Online payments (Safepay, JazzCash, Easypaisa, Upaisa) — refunds are issued to the original payment method; your bank or payment provider may take additional time to post the credit.',
      'Cash on Delivery (COD) — refunds are processed by bank transfer to the account details you provide.',
      'If you receive a refund, the cost of return shipping will be deducted from your refund.',
      'Customised, perishable, or hygiene-sensitive products (e.g., opened consumables) may not be returnable unless defective, as stated on the product page.',
    ],
  },
  {
    heading: '10. Refund Delays or Issues',
    body: 'If you have not received your refund within the stated timeframe, first check with your bank or payment provider. If the refund is still missing, contact us at support@htashop.com with your order number and we will investigate promptly.',
  },
  {
    heading: '11. Policy Changes',
    body: 'We may update this policy from time to time. Changes will be posted on this page with an updated effective date and apply to orders placed after the change, unless required by law to apply earlier.',
  },
  {
    heading: '12. Contact',
    body: 'For shipping, cancellation, return, or refund support, contact us at support@htashop.com or +92 300 0000000.',
  },
]

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Shipping, Cancellations & Return/Refund Policy"
      description="How delivery, cancellations, returns, exchanges, and refunds work on HTAShop."
      updated="August 22, 2026"
      sections={SECTIONS}
    />
  )
}
