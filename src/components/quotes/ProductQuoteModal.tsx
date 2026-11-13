import type { CatalogProduct } from '@/api/catalog'
import { QuoteModal } from './QuoteModal'

/**
 * Wires a catalogue card to the quote form.
 *
 * The card components only know `CatalogProduct`; this adapter maps it to the
 * smaller context the modal submits with the request.
 */
export function ProductQuoteModal({
  product,
  onClose,
}: {
  product: CatalogProduct | null
  onClose: () => void
}) {
  return (
    <QuoteModal
      isOpen={product !== null}
      onClose={onClose}
      product={
        product
          ? {
              id: product.id,
              name: product.name,
              routeKey: product.route_key,
              sku: product.seller_sku ?? null,
              partNumber: product.part_number ?? null,
              modelNumber: product.model_number ?? null,
              gtin: product.gtin ?? null,
              brand: product.brands?.[0]?.name ?? null,
              quantity: 1,
              unitPrice: Number(product.price ?? 0) || null,
              currency: product.currency ?? null,
              imageUrl: product.image_url,
            }
          : null
      }
    />
  )
}
