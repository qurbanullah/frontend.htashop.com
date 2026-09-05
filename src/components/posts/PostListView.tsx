import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileText, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type PostSummary, postsApi } from '@/api/posts'
import { PostCard } from '@/components/posts/PostCard'

interface PostListViewProps {
  type: 'blog' | 'news' | 'event'
  title: string
  subtitle?: string
}

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
          key={index}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="aspect-[16/9] animate-pulse bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2 p-5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PostListView({ type, title, subtitle }: PostListViewProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    setPage(1)
  }, [])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['posts', type, debouncedSearch, page],
    queryFn: () => {
      const fetcher =
        type === 'blog' ? postsApi.blogs : type === 'news' ? postsApi.news : postsApi.events
      return fetcher({
        search: debouncedSearch || undefined,
        page,
        per_page: 12,
      })
    },
    staleTime: 5 * 60 * 1000,
  })

  const items: PostSummary[] = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl text-gray-900 tracking-tight dark:text-white">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-gray-600 dark:text-gray-300">{subtitle}</p>}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 text-gray-900 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 border-dashed py-24 text-center dark:border-gray-800">
            <FileText className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
              No {title.toLowerCase()} found
            </h3>
            <p className="mt-1 max-w-sm text-gray-500 text-sm dark:text-gray-400">
              {search
                ? 'Try adjusting your search to find what you are looking for.'
                : 'Check back soon — new content is on the way.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <PostCard key={item.id} item={item} />
              ))}
            </div>

            {meta && meta.last_page > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={meta.current_page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 font-medium text-gray-700 text-sm disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-gray-500 text-sm dark:text-gray-400">
                  Page {meta.current_page} of {meta.last_page}
                </span>
                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page || isFetching}
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 font-medium text-gray-700 text-sm disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
