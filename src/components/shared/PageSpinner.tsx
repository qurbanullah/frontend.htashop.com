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
      <div className="w-10 h-10 border-4 border-gray-200 rounded-full border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400 animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
