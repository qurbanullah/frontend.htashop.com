import { Link } from "react-router-dom";
import { paths } from "@/routes/paths";

/**
 * 404 — catch-all for unmatched routes.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="mb-4 text-4xl font-bold text-gray-800 dark:text-gray-200">
        404
      </h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Page not found
      </p>
      <Link
        to={paths.login}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to login
      </Link>
    </div>
  );
}
