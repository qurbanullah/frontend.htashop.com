import { Link } from "react-router-dom";
import { ChevronRight, Mail, Clock, FileText, CalendarDays } from "lucide-react";
import { paths } from "@/routes/paths";

export interface LegalSection {
  heading: string;
  body?: string;
  bullets?: string[];
}

interface LegalLayoutProps {
  title: string;
  description?: string;
  updated: string;
  sections: LegalSection[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Shared shell for compliance / legal pages — header, sticky table of
 * contents, article content, and a contact card.
 */
export function LegalLayout({ title, description, updated, sections }: LegalLayoutProps) {
  return (
    <div className="mx-auto max-w-[1920px] px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
        <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 dark:text-gray-300">{title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* TOC */}
        <aside className="hidden lg:col-span-3 lg:block">
          <nav className="sticky top-40 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <FileText className="h-3.5 w-3.5" /> On this page
            </p>
            <ul className="mt-3 space-y-2">
              {sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slugify(section.heading)}`}
                    className="block text-sm text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Last updated: {updated}
              </p>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <article className="min-w-0 lg:col-span-9">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">{description}</p>}
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <CalendarDays className="h-3.5 w-3.5" />
              Effective date: {updated}
            </p>
          </header>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.heading} id={slugify(section.heading)} className="scroll-mt-44">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{section.heading}</h2>
                {section.body && (
                  <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">{section.body}</p>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Questions about this policy?</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Our support team is happy to help. Contact us and we'll respond as soon as possible.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-6">
              <a href="mailto:support@htashop.com" className="inline-flex items-center gap-2 font-medium text-blue-700 hover:underline dark:text-blue-400">
                <Mail className="h-4 w-4" /> support@htashop.com
              </a>
              <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4" /> 24/7 support
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
