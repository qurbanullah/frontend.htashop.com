import { Link } from 'react-router-dom'
import { paths } from '@/routes/paths'

/**
 * 404 — catch-all for unmatched routes.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="mb-4 font-bold text-4xl text-gray-800 dark:text-gray-200">404</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">Page not found</p>
      <Link
        to={paths.login}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700"
      >
        Back to login
      </Link>
    </div>
  )
}
