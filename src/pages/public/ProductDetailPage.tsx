import { useQuery } from '@tanstack/react-query'
import {
  Check,
  ChevronRight,
  Loader2,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Truck,
  ZoomIn,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { catalogApi } from '@/api/catalog'
import { reviewsApi } from '@/api/reviews'
import { BannerZone } from '@/components/banners/BannerRenderer'
import { ProductImageModal } from '@/components/catalog/ProductImageModal'
import { ProductReviews } from '@/components/catalog/ProductReviews'
import { Seo, siteUrl } from '@/components/seo/Seo'
import { COMPANY } from '@/lib/company'
import { buildSrcset, PRODUCT_IMAGE_LADDER, preferUrl } from '@/lib/image-srcset'
import { formatMoney } from '@/lib/money'
import { paths } from '@/routes/paths'
import { useCartStore } from '@/stores/cart'

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: product detail page — gallery, variant selector, quantity, add-to-cart and spec rendering are inherently branch-heavy; galleries and pricing already extracted to helpers
export default function ProductDetailPage() {
  const { t } = useTranslation()
  const { slugUuid } = useParams<{ slugUuid: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const addToCart = useCartStore((s) => s.addItem)
  const cartLoading = useCartStore((s) => s.isLoading)

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['catalog-product', slugUuid],
    queryFn: () => catalogApi.product(slugUuid ?? ''),
    enabled: Boolean(slugUuid),
  })

  const { data: reviewSummary } = useQuery({
    queryKey: ['product-reviews-summary', slugUuid],
    queryFn: () => reviewsApi.summary(slugUuid ?? ''),
    enabled: Boolean(slugUuid),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Seo
          title={t('product.loading_title')}
          description={t('product.loading_description')}
          canonical={slugUuid ? `/products/${slugUuid}` : undefined}
          robots="noindex, nofollow"
        />
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <Seo
          title={t('product.not_found_title')}
          description={t('product.not_found_description')}
          canonical={slugUuid ? `/products/${slugUuid}` : undefined}
          robots="noindex, nofollow"
        />
        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h1 className="mt-4 font-semibold text-gray-900 text-lg dark:text-white">
          {t('product.not_found_heading')}
        </h1>
        <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
          {t('product.not_found_description')}
        </p>
        <Link
          to={paths.products}
          className="mt-6 font-medium text-blue-600 text-sm hover:underline dark:text-blue-400"
        >
          {t('product.browse')}
        </Link>
      </div>
    )
  }

  const gallery = product.gallery?.length
    ? product.gallery
    : product.image_url
      ? [product.image_url]
      : []
  const originalGallery = product.gallery_original?.length
    ? product.gallery_original
    : product.image_original_url
      ? [product.image_original_url]
      : gallery
  const galleryLadders = product.gallery_sizes ?? []
  const selectedLadder = galleryLadders[selectedImage] ?? product.image_urls ?? null
  const selectedSrcset = buildSrcset(selectedLadder, PRODUCT_IMAGE_LADDER)
  const selectedImageSrc =
    preferUrl(selectedLadder, ['large', 'medium', 'original']) ?? gallery[selectedImage]
  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId) ?? null

  const basePrice = Number(selectedVariant?.price ?? product.price)
  const salePrice = Number(selectedVariant?.sale_price ?? product.sale_price)
  const displayPrice = salePrice > 0 && salePrice < basePrice ? salePrice : basePrice
  const brand = product.brands?.[0]?.name
  const category = product.categories?.[0]

  const stock = product.stock
  const stockLabel = stock?.track_inventory
    ? stock.available > 0
      ? t('product.in_stock')
      : t('product.out_of_stock')
    : t('product.available_on_request')

  const quoteSubject = encodeURIComponent(t('product.quote_subject', { name: product.name }))

  const isInStock = !stock?.track_inventory || stock.available > 0
  const metaDescription = (product.summary || product.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: gallery,
    description: metaDescription || undefined,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    sku: selectedVariant?.sku ?? undefined,
    offers: {
      '@type': 'Offer',
      url: siteUrl(`/products/${product.route_key}`),
      priceCurrency: selectedVariant?.currency ?? product.currency ?? 'PKR',
      price: displayPrice,
      availability: isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating:
      reviewSummary && reviewSummary.count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(reviewSummary.average.toFixed(1)),
            reviewCount: reviewSummary.count,
          }
        : undefined,
  }

  return (
    <div className="shell mx-auto px-2 py-8">
      <Seo
        title={product.name}
        description={metaDescription || t('product.buy_online', { name: product.name })}
        keywords={[
          product.name,
          ...(brand ? [brand] : []),
          ...(category ? [category.name] : []),
          'HTAShop',
          'buy online Pakistan',
        ]}
        canonical={`/products/${product.route_key}`}
        image={gallery[0]}
        type="product"
        jsonLd={productLd}
      />
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex flex-wrap items-center gap-1 text-gray-500 text-sm dark:text-gray-400"
        aria-label={t('breadcrumb.label')}
      >
        <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">
          {t('breadcrumb.home')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <Link to={paths.products} className="hover:text-gray-900 dark:hover:text-white">
          {t('breadcrumb.products')}
        </Link>
        {category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
          </>
        )}
      </nav>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Gallery */}
        <div className="flex lg:col-span-6">
          {gallery.length > 1 && (
            <div className="flex shrink-0 flex-col gap-2">
              {gallery.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border ${
                    selectedImage === index
                      ? 'border-blue-600 ring-2 ring-blue-600/20'
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <img
                    src={preferUrl(galleryLadders[index], ['small', 'medium']) ?? url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setImageModalOpen(true)}
            className="group relative min-w-0 max-w-150 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            aria-label={t('product.view_larger')}
          >
            {gallery[selectedImage] ? (
              <img
                src={selectedImageSrc}
                srcSet={selectedSrcset}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 48vw, 600px"
                alt={product.name}
                className="aspect-square max-h-150 w-full max-w-150 object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center">
                <Package className="h-24 w-24 text-gray-300 dark:text-gray-600" />
              </div>
            )}

            {gallery[selectedImage] && (
              <span className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors group-hover:bg-black/70">
                <ZoomIn className="h-5 w-5" />
              </span>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="lg:col-span-3">
          {brand && (
            <p className="font-semibold text-blue-600 text-sm uppercase tracking-wide dark:text-blue-400">
              {brand}
            </p>
          )}
          <h1 className="mt-1 font-bold text-3xl text-gray-900 dark:text-white">{product.name}</h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-bold text-2xl text-gray-900 dark:text-white">
              {formatMoney(displayPrice, selectedVariant?.currency ?? product.currency)}
            </span>
            {salePrice > 0 && salePrice < basePrice && (
              <span className="text-base text-gray-400 line-through">
                {formatMoney(basePrice, product.currency)}
              </span>
            )}
          </div>

          {product.summary && (
            <p className="mt-3 text-gray-600 dark:text-gray-300">{product.summary}</p>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-semibold text-gray-900 text-sm dark:text-white">
                {t('product.variants')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const config = Object.entries(variant.configuration ?? {})
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ')
                  const selected = selectedVariantId === variant.id
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`rounded-xl border px-4 py-2 text-left text-sm transition-colors ${
                        selected
                          ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {variant.name}
                      </div>
                      {config && (
                        <div className="mt-0.5 text-gray-500 text-xs dark:text-gray-400">
                          {config}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {product.highlights && product.highlights.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-semibold text-gray-900 text-sm dark:text-white">
                {t('product.about')}
              </h3>
              <ul className="space-y-2">
                {product.highlights.map((highlight) => (
                  <li
                    key={highlight.id}
                    className="flex gap-2 text-gray-600 text-sm dark:text-gray-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" />
                    <span>
                      {highlight.heading && (
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {highlight.heading}:{' '}
                        </span>
                      )}
                      {highlight.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-semibold text-gray-900 text-sm dark:text-white">
                {t('product.key_features')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.features.map((feature) => (
                  <span
                    key={feature.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-gray-700 text-sm dark:bg-gray-800 dark:text-gray-300"
                  >
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    {feature.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buy box / shipment */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-baseline gap-3">
              <span className="font-bold text-2xl text-gray-900 dark:text-white">
                {formatMoney(displayPrice, selectedVariant?.currency ?? product.currency)}
              </span>
              {salePrice > 0 && salePrice < basePrice && (
                <span className="text-base text-gray-400 line-through">
                  {formatMoney(basePrice, product.currency)}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-sm ${
                  stock?.track_inventory && stock.available <= 0
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                {stockLabel}
              </span>
              {stock?.track_inventory && stock.available > 0 && (
                <span className="text-gray-500 text-sm dark:text-gray-400">
                  {t('product.units_available', { count: stock.available })}
                </span>
              )}
            </div>

            <div className="mt-5 border-gray-100 border-t pt-4 dark:border-gray-800">
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div className="text-gray-600 text-sm dark:text-gray-300">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('product.shipping')}
                  </p>
                  <p>{t('product.ships_from')}</p>
                  <p>{t('product.delivery_note')}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex h-11 items-center rounded-xl border border-gray-300 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-full w-10 items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
                aria-label={t('product.decrease_qty')}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold text-gray-900 text-sm dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-full w-10 items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
                aria-label={t('product.increase_qty')}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                addToCart({
                  product_id: product.id,
                  variant_id: selectedVariant?.id ?? null,
                  quantity,
                })
              }
              disabled={cartLoading}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartLoading ? t('product.adding') : t('product.add_to_cart')}
            </button>

            <a
              href={`mailto:${COMPANY.salesEmail}?subject=${quoteSubject}`}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 font-semibold text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Truck className="h-4 w-4" />
              {t('product.request_quote')}
            </a>
            <a
              href={`mailto:${COMPANY.email}?subject=${quoteSubject}`}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 font-semibold text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <MessageCircle className="h-4 w-4" />
              {t('product.ask_question')}
            </a>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-bold text-gray-900 text-xl dark:text-white">
            {t('product.description')}
          </h2>
          <div className="mt-3 space-y-3 text-gray-600 dark:text-gray-300">
            {product.description ? (
              product.description
                .split(/\n+/)
                .map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            ) : (
              <p className="text-gray-400">{t('product.no_description')}</p>
            )}
          </div>
        </div>

        {product.specs && product.specs.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 text-xl dark:text-white">
              {t('product.specifications')}
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              {product.specs.map((spec, index) => (
                <div
                  key={spec.key}
                  className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/40' : 'bg-white dark:bg-gray-900'}`}
                >
                  <span className="text-gray-500 dark:text-gray-400">{spec.key}</span>
                  <span className="text-right font-medium text-gray-900 dark:text-white">
                    {spec.value}{' '}
                    {spec.unit_name && <span className="text-gray-400">({spec.unit_name})</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ProductReviews routeKey={product.route_key} />

      {/* Banner zone — product detail placement */}
      <div className="mt-12">
        <BannerZone placement="product_detail" categoryId={product.categories?.[0]?.id} />
      </div>

      <ProductImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={gallery}
        originalImages={originalGallery}
        initialIndex={selectedImage}
        title={product.name}
      />
    </div>
  )
}
