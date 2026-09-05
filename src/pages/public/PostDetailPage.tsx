import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, FileText, Loader2, Tag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { postsApi } from '@/api/posts'
import { Seo } from '@/components/seo/Seo'

const LIST_PATHS: Record<string, { to: string; label: string }> = {
  blog: { to: '/blogs', label: 'Blog' },
  news: { to: '/news', label: 'News' },
  event: { to: '/events', label: 'Events' },
}

function formatDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function PostDetailPage() {
  const { slug = '' } = useParams()
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => postsApi.show(slug),
    enabled: Boolean(slug),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-28">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-28 text-center sm:px-6 lg:px-8">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Content not found</h1>
        <p className="mt-2 text-gray-500 text-sm dark:text-gray-400">
          This page may have been removed or is not published yet.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1 font-medium text-blue-600 text-sm hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    )
  }

  const listInfo = LIST_PATHS[post.type] ?? { to: '/', label: 'Home' }
  const publishedDate = formatDate(post.published_at ?? post.date)

  return (
    <>
      <Seo
        title={`${post.title} — HTAShop`}
        description={post.excerpt ?? post.description ?? post.title}
        keywords={[...post.tags, ...post.categories, 'HTAShop'].filter(Boolean)}
        canonical={`${listInfo.to}/${post.slug}`}
        type="article"
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to={listInfo.to}
          className="inline-flex items-center gap-1 text-gray-500 text-sm hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" /> All {listInfo.label}
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-3 text-gray-500 text-sm dark:text-gray-400">
            {post.category && (
              <span className="font-medium text-blue-600 uppercase dark:text-blue-400">
                {post.category}
              </span>
            )}
            {publishedDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {publishedDate}
              </span>
            )}
          </div>
          <h1 className="mt-3 font-extrabold text-3xl text-gray-900 tracking-tight sm:text-4xl dark:text-white">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-gray-600 text-lg dark:text-gray-300">{post.excerpt}</p>
          )}
        </header>

        {post.featured_image_url && (
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="mt-8 h-64 w-full rounded-2xl object-cover sm:h-80"
          />
        )}

        <div
          className="prose prose-gray dark:prose-invert mt-8 max-w-none"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored HTML content from the CMS
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-gray-100 border-t pt-6 dark:border-gray-800">
            <Tag className="h-4 w-4 text-gray-400" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </>
  )
}
