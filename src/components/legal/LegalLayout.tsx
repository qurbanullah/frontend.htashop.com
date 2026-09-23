import { CalendarDays, ChevronRight, Clock, FileText, Mail, MapPin, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { COMPANY, COMPANY_ADDRESS_LINE } from '@/lib/company'
import { paths } from '@/routes/paths'

export interface LegalSection {
  heading: string
  body?: string
  bullets?: string[]
}

interface LegalLayoutProps {
  title: string
  description?: string
  /** Canonical path (e.g. paths.policiesPrivacy) — also drives the page's SEO tags. */
  canonical: string
  updated: string
  sections: LegalSection[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Shared shell-narrow for compliance / legal pages — header, sticky table of
 * contents, article content, and a contact card.
 */
export function LegalLayout({
  title,
  description,
  canonical,
  updated,
  sections,
}: LegalLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="shell-narrow mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <Seo title={title} description={description} canonical={canonical} type="article" />
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-1 text-gray-500 text-sm dark:text-gray-400"
        aria-label={t('breadcrumb.label')}
      >
        <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">
          {t('breadcrumb.home')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="text-gray-700 dark:text-gray-300">{title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* TOC */}
        <aside className="hidden lg:col-span-3 lg:block">
          <nav className="sticky top-40 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="flex items-center gap-2 font-semibold text-gray-400 text-xs uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" /> {t('legal.on_this_page')}
            </p>
            <ul className="mt-3 space-y-2">
              {sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slugify(section.heading)}`}
                    className="block text-gray-600 text-sm transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 border-gray-100 border-t pt-4 dark:border-gray-800">
              <p className="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {t('legal.last_updated', { date: updated })}
              </p>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <article className="min-w-0 lg:col-span-9">
          <header className="mb-8">
            <h1 className="font-bold text-3xl text-gray-900 tracking-tight sm:text-4xl dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">{description}</p>
            )}
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600 text-xs dark:bg-gray-800 dark:text-gray-300">
              <CalendarDays className="h-3.5 w-3.5" />
              {t('legal.effective_date', { date: updated })}
            </p>
          </header>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.heading} id={slugify(section.heading)} className="scroll-mt-44">
                <h2 className="font-semibold text-gray-900 text-xl dark:text-white">
                  {section.heading}
                </h2>
                {section.body && (
                  <p className="mt-3 text-gray-600 leading-relaxed dark:text-gray-300">
                    {section.body}
                  </p>
                )}
                {section.bullets && (
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2.5 text-gray-600 dark:text-gray-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Contact card */}
          <div className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900/40 dark:bg-blue-950/20">
            <h2 className="font-semibold text-gray-900 text-lg dark:text-white">
              {t('legal.questions_title')}
            </h2>
            <p className="mt-2 text-gray-600 text-sm leading-relaxed dark:text-gray-300">
              {t('legal.questions_body')}
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <a
                href={`mailto:${COMPANY.email}`}
                className="inline-flex items-center gap-2 font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                <Mail className="h-4 w-4" /> {COMPANY.email}
              </a>
              <a
                href={COMPANY.phoneHref}
                className="inline-flex items-center gap-2 font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                <Phone className="h-4 w-4" /> {COMPANY.phoneDisplay}
              </a>
              <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4" /> {t('legal.support_hours')}
              </span>
            </div>
            <p className="mt-3 inline-flex items-start gap-2 text-gray-500 text-xs leading-relaxed dark:text-gray-400">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {COMPANY_ADDRESS_LINE}
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
