import { CalendarDays, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PostSummary } from '@/api/posts'
import { paths } from '@/routes/paths'

export function postPath(type: string, slug: string): string {
  if (type === 'news') return `${paths.news}/${slug}`
  if (type === 'event') return `${paths.events}/${slug}`
  return `${paths.blogs}/${slug}`
}

function formatDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function PostCard({ item }: { item: PostSummary }) {
  const href = postPath(item.type, item.slug)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <Link to={href} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          {item.featured_image_url ? (
            <img
              src={item.featured_image_url}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-gray-500 text-xs dark:text-gray-400">
          {item.category && (
            <span className="font-medium text-blue-600 uppercase dark:text-blue-400">
              {item.category}
            </span>
          )}
          {item.date && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(item.date)}
            </span>
          )}
        </div>

        <Link to={href}>
          <h2 className="mt-2 line-clamp-2 font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
            {item.title}
          </h2>
        </Link>

        {item.excerpt && (
          <p className="mt-2 line-clamp-3 text-gray-600 text-sm dark:text-gray-300">
            {item.excerpt}
          </p>
        )}

        {item.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
