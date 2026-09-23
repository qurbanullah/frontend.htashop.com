import { paths } from '@/routes/paths'

/**
 * Public content sections — one dedicated route per post type.
 *
 * This is the single source of truth for the storefront content sections: the
 * router, the list pages, the post cards, the detail page's canonical URL and
 * the sub-navigation all read from here. Adding a section is a one-line change.
 *
 * `type` must match a value of the API's PostTypeEnum, and `path` must match
 * that type's PostTypeEnum::webSection() so sitemaps and canonical URLs agree.
 *
 * All copy is resolved through i18n keys under the `posts.*` namespace so the
 * section headings and metadata follow the active locale.
 */
export interface PostSection {
  /** PostTypeEnum value, e.g. "blog" — used to filter the API. */
  type: string
  /** Storefront base path; the list route and canonical prefix. */
  path: string
  /** i18n key for the section name — heading, breadcrumb and SEO title. */
  titleKey: string
  /** i18n key for the subtitle shown under the heading. */
  subtitleKey: string
  /** i18n key for the SEO meta description. */
  descriptionKey: string
  /** SEO keywords, kept in English alongside the other public pages. */
  keywords: string[]
}

const BLOG_SECTION: PostSection = {
  type: 'blog',
  path: paths.blogs,
  titleKey: 'posts.section_blog_title',
  subtitleKey: 'posts.section_blog_subtitle',
  descriptionKey: 'posts.section_blog_description',
  keywords: ['HTAShop blog', 'e-commerce insights', 'buying guides', 'industry news'],
}

export const POST_SECTIONS: PostSection[] = [
  BLOG_SECTION,
  {
    type: 'news',
    path: paths.news,
    titleKey: 'posts.section_news_title',
    subtitleKey: 'posts.section_news_subtitle',
    descriptionKey: 'posts.section_news_description',
    keywords: ['HTAShop news', 'company updates', 'latest news'],
  },
  {
    type: 'event',
    path: paths.events,
    titleKey: 'posts.section_event_title',
    subtitleKey: 'posts.section_event_subtitle',
    descriptionKey: 'posts.section_event_description',
    keywords: ['HTAShop events', 'webinars', 'exhibitions', 'trade shows'],
  },
  {
    type: 'announcement',
    path: paths.announcements,
    titleKey: 'posts.section_announcement_title',
    subtitleKey: 'posts.section_announcement_subtitle',
    descriptionKey: 'posts.section_announcement_description',
    keywords: ['HTAShop announcements', 'notices', 'service updates'],
  },
  {
    type: 'press_release',
    path: paths.pressReleases,
    titleKey: 'posts.section_press_release_title',
    subtitleKey: 'posts.section_press_release_subtitle',
    descriptionKey: 'posts.section_press_release_description',
    keywords: ['HTAShop press release', 'media', 'company news'],
  },
  {
    type: 'promotion',
    path: paths.promotions,
    titleKey: 'posts.section_promotion_title',
    subtitleKey: 'posts.section_promotion_subtitle',
    descriptionKey: 'posts.section_promotion_description',
    keywords: ['HTAShop promotions', 'discounts', 'offers', 'deals'],
  },
  {
    type: 'update',
    path: paths.updates,
    titleKey: 'posts.section_update_title',
    subtitleKey: 'posts.section_update_subtitle',
    descriptionKey: 'posts.section_update_description',
    keywords: ['HTAShop updates', 'release notes', 'new features'],
  },
  {
    type: 'showcase',
    path: paths.showcases,
    titleKey: 'posts.section_showcase_title',
    subtitleKey: 'posts.section_showcase_subtitle',
    descriptionKey: 'posts.section_showcase_description',
    keywords: ['HTAShop showcase', 'featured products', 'supplier spotlight'],
  },
  {
    // Served under /guides because /tutorials belongs to the Tutorial system.
    type: 'tutorial',
    path: paths.guides,
    titleKey: 'posts.section_tutorial_title',
    subtitleKey: 'posts.section_tutorial_subtitle',
    descriptionKey: 'posts.section_tutorial_description',
    keywords: ['HTAShop guides', 'how-to', 'tutorials'],
  },
  {
    type: 'newsletter',
    path: paths.newsletters,
    titleKey: 'posts.section_newsletter_title',
    subtitleKey: 'posts.section_newsletter_subtitle',
    descriptionKey: 'posts.section_newsletter_description',
    keywords: ['HTAShop newsletter', 'email updates', 'past issues'],
  },
]

export const POST_SECTION_BY_TYPE: Record<string, PostSection | undefined> = Object.fromEntries(
  POST_SECTIONS.map((section) => [section.type, section])
)

/** Used only for unknown/legacy post types so links and canonicals never break. */
export const FALLBACK_POST_SECTION: PostSection = BLOG_SECTION
