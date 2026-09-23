import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Sparkles, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { catalogApi } from '@/api/catalog'
import { BannerZone, SplitBannerCarousel } from '@/components/banners/BannerRenderer'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductRail } from '@/components/catalog/ProductRail'
import { Seo, SITE_URL, siteUrl } from '@/components/seo/Seo'
import { useBanners } from '@/hooks/useBanners'
import { cdnUrl } from '@/lib/cdn'
import { COMPANY } from '@/lib/company'
import { paths } from '@/routes/paths'

/** Banner types rendered as image strips between product sections (hero and split have dedicated zones). */
const NON_HERO_BANNER_TYPES = ['promo', 'sponsored', 'top_brands', 'just_launched', 'single']

function SectionHeader({ title, subtitle, to }: { title: string; subtitle?: string; to?: string }) {
  const { t } = useTranslation()

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
          {t('home.view_all')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

/** Branded fallback hero — shown only when no hero banners are configured. */
function FallbackHero() {
  const { t } = useTranslation()

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-sm dark:border-gray-800">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_top_right,rgba(255,255,255,0.35)_0,transparent_45%)]" />
      <div className="relative flex flex-col items-start gap-5 px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 font-semibold text-white text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          {t('home.badge')}
        </span>
        <h1 className="max-w-3xl font-extrabold text-3xl text-white tracking-tight sm:text-5xl">
          {t('home.hero_title')}
        </h1>
        <p className="max-w-2xl text-base text-blue-100 sm:text-lg">{t('home.hero_subtitle')}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={paths.products}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-blue-700 text-sm shadow-lg transition-colors hover:bg-blue-50"
          >
            {t('home.shop_now')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Link
            to={paths.register}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/40 px-6 font-semibold text-sm text-white transition-colors hover:bg-white/10"
          >
            <Store className="h-4 w-4" />
            {t('home.become_supplier')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { t } = useTranslation()

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HTAShop',
    legalName: COMPANY.name,
    url: SITE_URL,
    logo: cdnUrl('brand/logo.png'),
    email: COMPANY.salesEmail,
    telephone: COMPANY.phoneIntl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${COMPANY.address.street}, ${COMPANY.address.locality}`,
      addressLocality: COMPANY.address.city,
      postalCode: COMPANY.address.postalCode,
      addressRegion: COMPANY.address.region,
      addressCountry: 'PK',
    },
    description:
      'HTAShop is an e-commerce platform connecting buyers with verified suppliers — online shopping with secure payments and fast delivery.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: COMPANY.salesEmail,
      telephone: COMPANY.phoneIntl,
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
  const splitBanners = homeBanners.filter((banner) => banner.type === 'split')
  const promoCount = homeBanners.filter((banner) =>
    NON_HERO_BANNER_TYPES.includes(banner.type)
  ).length

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
        title={t('home.seo_title')}
        description={t('home.seo_description')}
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

      {/* 1 — Hero banner slider (banner system, aligned to the 1600px shell like every other section) */}
      <section className="bg-gray-100 py-6 dark:bg-gray-950">
        <div className="shell mx-auto px-4 sm:px-6 lg:px-8">
          {heroCount > 0 ? (
            <BannerZone placement="home" types={['hero']} fullWidth />
          ) : (
            <FallbackHero />
          )}
        </div>
      </section>

      {/* 1b — Split banner grid carousel (under the hero) */}
      {splitBanners.length > 0 && (
        <section className="shell mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <SplitBannerCarousel banners={splitBanners} />
        </section>
      )}

      {/* 2 — New arrivals */}
      <section className="shell mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('home.new_arrivals')}
          subtitle={t('home.new_arrivals_sub')}
          to={paths.products}
        />
        <ProductGrid products={newArrivals.data?.data ?? []} isLoading={newArrivals.isLoading} />
      </section>

      {/* 3 — Trending carousel (the in-page slider) */}
      <section className="border-gray-200 border-y bg-white py-10 dark:border-gray-800 dark:bg-gray-950">
        <div className="shell mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title={t('home.trending')}
            subtitle={t('home.trending_sub')}
            to={paths.products}
          />
          <ProductRail products={trending.data?.data ?? []} isLoading={trending.isLoading} />
        </div>
      </section>

      {/* 4 — Promo banner strip (banner system, remaining non-hero types) */}
      {promoCount > 0 && (
        <div className="shell mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <BannerZone placement="home" types={NON_HERO_BANNER_TYPES} />
        </div>
      )}

      {/* 5 — Best sellers */}
      <section className="shell mx-auto px-4 pb-14 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('home.best_sellers')}
          subtitle={t('home.best_sellers_sub')}
          to={paths.products}
        />
        <ProductGrid products={bestSellers.data?.data ?? []} isLoading={bestSellers.isLoading} />
      </section>
    </div>
  )
}
