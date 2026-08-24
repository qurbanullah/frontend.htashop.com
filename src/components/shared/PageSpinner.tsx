/**
 * Global page-loading spinner — used as the single Suspense fallback
 * across the entire app. Fixed to the viewport so it's always centred
 * regardless of parent layout.
 */
export function PageSpinner() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-900"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
