import { useQuery } from '@tanstack/react-query'
import {
  Check,
  ChevronRight,
  Clock,
  Film,
  Loader2,
  MessageCircle,
  Minus,
  Package,
  Play,
  Plus,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { catalogApi } from '@/api/catalog'
import { reviewsApi } from '@/api/reviews'
import { BannerZone } from '@/components/banners/BannerRenderer'
import { ProductGallerySlider } from '@/components/catalog/ProductGallerySlider'
import { ProductImageModal } from '@/components/catalog/ProductImageModal'
import { ProductPackaging } from '@/components/catalog/ProductPackaging'
import { ProductReviews } from '@/components/catalog/ProductReviews'
import { ProductThumbnailRail } from '@/components/catalog/ProductThumbnailRail'
import { ProductVideoModal } from '@/components/catalog/ProductVideoModal'
import { RichTextContent } from '@/components/catalog/RichTextContent'
import { Seo, siteUrl } from '@/components/seo/Seo'
import { track } from '@/lib/analytics/collector'
import { COMPANY } from '@/lib/company'
import { formatMoney } from '@/lib/money'
import { paths } from '@/routes/paths'
import { useCartStore } from '@/stores/cart'

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: product detail page — gallery, variant selector, quantity, add-to-cart and spec rendering are inherently branch-heavy; galleries and pricing already extracted to helpers
export default function ProductDetailPage() {
  const { t } = useTranslation()
  const { slugUuid } = useParams<{ slugUuid: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [activeVideoPoster, setActiveVideoPoster] = useState<string | null>(null)
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

  const trackedProductId = useRef<number | null>(null)

  useEffect(() => {
    if (!product || trackedProductId.current === product.id) return

    trackedProductId.current = product.id

    track('product_view', {
      product: {
        id: product.id,
        name: product.name,
        price: Number(product.price ?? 0),
        currency: product.currency ?? 'PKR',
        category_id: product.categories?.[0]?.id,
      },
      page: { path: `/products/${product.route_key}` },
    })
  }, [product])

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
  const videos = product.videos ?? []
  const hasSpecs = (product.specs?.length ?? 0) > 0
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

  const isOnDemand = product.sourcing != null && product.sourcing !== 'in_stock'
  const isInStock = !stock?.track_inventory || stock.available > 0
  const metaDescription = (product.summary || (product.description ?? '').replace(/<[^>]*>/g, ' '))
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

  const openImageAt = (index: number) => {
    setSelectedImage(index)
    setImageModalOpen(true)
  }

  return (
    <div className="shell mx-auto px-4 py-8 sm:px-0">
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

      <div className="grid items-start gap-4 lg:grid-cols-12">
        {/* Gallery */}
        <div className="lg:col-span-5">
          <ProductGallerySlider
            className="lg:hidden"
            images={gallery}
            ladders={galleryLadders}
            alt={product.name}
            index={selectedImage}
            onIndexChange={setSelectedImage}
            onOpen={openImageAt}
            openLabel={t('product.view_larger')}
            showDots
          />

          <div className="hidden gap-3 lg:flex">
            <ProductThumbnailRail
              images={gallery}
              ladders={galleryLadders}
              index={selectedImage}
              onSelect={setSelectedImage}
              alt={product.name}
            />

            <ProductGallerySlider
              className="min-w-0 flex-1 self-start"
              images={gallery}
              ladders={galleryLadders}
              alt={product.name}
              index={selectedImage}
              onIndexChange={setSelectedImage}
              onOpen={openImageAt}
              openLabel={t('product.view_larger')}
              showArrows
            />
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-4">
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
              {isOnDemand ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700 text-sm dark:bg-blue-900/30 dark:text-blue-400">
                  <Clock className="h-3.5 w-3.5" />
                  {product.availability ?? stockLabel}
                </span>
              ) : (
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
              )}
              {!isOnDemand && stock?.track_inventory && stock.available > 0 && (
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
              onClick={() => {
                const currency = selectedVariant?.currency ?? product.currency ?? 'PKR'

                track('add_to_cart', {
                  product: {
                    id: product.id,
                    variant_id: selectedVariant?.id ?? null,
                    name: product.name,
                    price: displayPrice,
                    currency,
                    category_id: product.categories?.[0]?.id,
                  },
                  cart: {
                    items: quantity,
                    value: displayPrice * quantity,
                    currency,
                  },
                  page: { path: `/products/${product.route_key}` },
                })

                void addToCart({
                  product_id: product.id,
                  variant_id: selectedVariant?.id ?? null,
                  quantity,
                })
              }}
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
            <Link
              to={paths.sourcing}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 font-semibold text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Package className="h-4 w-4" />
              {t('product.source_kit')}
            </Link>
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

      {/* Specifications — full width, six columns on desktop */}
      {hasSpecs && (
        <section className="mt-12">
          <h2 className="font-bold text-gray-900 text-xl dark:text-white">
            {t('product.specifications')}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {product.specs?.map((spec) => (
              <div
                key={spec.key}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900/40"
              >
                <dt className="text-gray-500 text-xs dark:text-gray-400">{spec.key}</dt>
                <dd className="mt-1 font-medium text-gray-900 text-sm dark:text-white">
                  {spec.value}{' '}
                  {spec.unit_name && <span className="text-gray-400">({spec.unit_name})</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Packaging & shipping facts — after the specifications */}
      {product.packaging && <ProductPackaging packaging={product.packaging} />}

      {/* Product videos — full-width block, directly above the description */}
      {videos.length > 0 && (
        <section className="mt-12" aria-label={t('product.videos')}>
          <div className="mb-4 flex items-center gap-2">
            <Film className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-gray-900 text-xl dark:text-white">
              {t('product.videos')}
            </h2>
          </div>
          <div className="space-y-4">
            {videos.map((video) => {
              const poster = video.poster_url ?? product.image_url ?? null

              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => {
                    setActiveVideoUrl(video.url)
                    setActiveVideoPoster(poster)
                  }}
                  aria-label={t('product.play_video')}
                  className="group relative block h-60 w-full cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 dark:border-gray-800"
                >
                  {poster ? (
                    <img
                      src={poster}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-r from-gray-800 to-gray-900">
                      <Film className="h-8 w-8 text-gray-600" />
                    </span>
                  )}

                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/45">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-transform group-hover:scale-105">
                      <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Description — full width, after the video block */}
      <section className="mt-12" aria-label={t('product.description')}>
        <h2 className="font-bold text-gray-900 text-xl dark:text-white">
          {t('product.description')}
        </h2>
        <div className="mt-3">
          {product.description ? (
            <RichTextContent html={product.description} />
          ) : (
            <p className="text-gray-400">{t('product.no_description')}</p>
          )}
        </div>
      </section>

      <ProductReviews routeKey={product.route_key} />

      {/* Banner zone — product detail placement */}
      <div className="mt-12">
        <BannerZone placement="product_detail" categoryId={product.categories?.[0]?.id} />
      </div>

      <ProductVideoModal
        isOpen={activeVideoUrl !== null}
        onClose={() => setActiveVideoUrl(null)}
        src={activeVideoUrl}
        poster={activeVideoPoster}
        title={product.name}
      />

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
