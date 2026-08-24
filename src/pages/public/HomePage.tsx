import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Sparkles, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { catalogApi } from '@/api/catalog'
import { BannerZone } from '@/components/banners/BannerRenderer'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductRail } from '@/components/catalog/ProductRail'
import { Seo, SITE_URL, siteUrl } from '@/components/seo/Seo'
import { useBanners } from '@/hooks/useBanners'
import { paths } from '@/routes/paths'

/** Non-hero banner types rendered as a promo strip between product sections. */
const PROMO_BANNER_TYPES = ['promo', 'sponsored', 'split', 'single']

function SectionHeader({ title, subtitle, to }: { title: string; subtitle?: string; to?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-bold text-gray-900 text-xl tracking-tight sm:text-2xl dark:text-white">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="group inline-flex shrink-0 items-center gap-1 font-semibold text-blue-600 text-sm hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

/** Branded fallback hero — shown only when no hero banners are configured. */
function FallbackHero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_top_right,rgba(255,255,255,0.35)_0,transparent_45%)]" />
      <div className="relative mx-auto flex max-w-[1920px] flex-col items-start gap-6 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 font-semibold text-white text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          E-commerce platform · Verified suppliers
        </span>
        <h1 className="max-w-3xl font-extrabold text-3xl text-white tracking-tight sm:text-5xl">
          Everything you need, delivered fast
        </h1>
        <p className="max-w-2xl text-base text-blue-100 sm:text-lg">
          Shop electronics, IT, MRO and industrial supplies from verified suppliers — secure
          payments and fast delivery.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={paths.products}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-blue-700 text-sm shadow-lg transition-colors hover:bg-blue-50"
          >
            Shop now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={paths.register}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/40 px-6 font-semibold text-sm text-white transition-colors hover:bg-white/10"
          >
            <Store className="h-4 w-4" />
            Become a supplier
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HTAShop',
    url: SITE_URL,
    logo: 'https://cdn.htashop.com/brand/logo.png',
    description:
      'HTAShop is an e-commerce platform connecting buyers with verified suppliers — online shopping with secure payments and fast delivery.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'sales@htashop.com',
      contactType: 'customer support',
      availableLanguage: ['English', 'Urdu'],
    },
  }

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HTAShop',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl('/products')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const { data: homeBanners = [] } = useBanners('home')
  const heroCount = homeBanners.filter((banner) => banner.type === 'hero').length
  const promoCount = homeBanners.filter((banner) => PROMO_BANNER_TYPES.includes(banner.type)).length

  const newArrivals = useQuery({
    queryKey: ['home', 'products', 'new-arrivals'],
    queryFn: () => catalogApi.products({ sort: 'newest', per_page: 10 }),
    staleTime: 5 * 60 * 1000,
  })

  const trending = useQuery({
    queryKey: ['home', 'products', 'trending'],
    queryFn: () => catalogApi.products({ sort: 'trending', per_page: 12 }),
    staleTime: 5 * 60 * 1000,
  })

  const bestSellers = useQuery({
    queryKey: ['home', 'products', 'best-sellers'],
    queryFn: () => catalogApi.products({ sort: 'best_sellers', per_page: 10 }),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div id="top">
      <Seo
        title="Online Shopping in Pakistan — Electronics, IT, MRO & Industrial Supplies"
        description="HTAShop is Pakistan's trusted e-commerce platform for electronics, IT, MRO, and industrial supplies. Shop from verified suppliers with secure payments, fast delivery, and 24/7 support."
        keywords={[
          'online shopping Pakistan',
          'electronics store',
          'IT products',
          'industrial supplies',
          'MRO supplies',
          'HTAShop',
          'buy online Pakistan',
          'B2B e-commerce',
        ]}
        canonical="/"
        type="website"
        jsonLd={[organizationLd, websiteLd]}
      />

      {/* 1 — Hero banner slider (banner system, full width) */}
      <section className="bg-gray-100 dark:bg-gray-950">
        {heroCount > 0 ? (
          <BannerZone placement="home" types={['hero']} fullWidth />
        ) : (
          <FallbackHero />
        )}
      </section>

      {/* 2 — New arrivals */}
      <section className="mx-auto max-w-[1920px] px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader title="New Arrivals" subtitle="Fresh from our catalog" to={paths.products} />
        <ProductGrid products={newArrivals.data?.data ?? []} isLoading={newArrivals.isLoading} />
      </section>

      {/* 3 — Trending carousel (the in-page slider) */}
      <section className="border-gray-200 border-y bg-white py-10 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Trending Now"
            subtitle="What shoppers are loving right now"
            to={paths.products}
          />
          <ProductRail products={trending.data?.data ?? []} isLoading={trending.isLoading} />
        </div>
      </section>

      {/* 4 — Promo banner strip (banner system, non-hero) */}
      {promoCount > 0 && (
        <div className="mx-auto max-w-[1920px] px-4 py-10 sm:px-6 lg:px-8">
          <BannerZone placement="home" types={PROMO_BANNER_TYPES} />
        </div>
      )}

      {/* 5 — Best sellers */}
      <section className="mx-auto max-w-[1920px] px-4 pb-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Best Sellers"
          subtitle="Top picks from verified suppliers"
          to={paths.products}
        />
        <ProductGrid products={bestSellers.data?.data ?? []} isLoading={bestSellers.isLoading} />
      </section>
    </div>
  )
}
