import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu, ChevronRight } from "lucide-react";
import { categoriesApi } from "@/api/categories";
import { paths } from "@/routes/paths";
import { useCategoryDrawerStore } from "@/stores/category-drawer";

export function CategoryNav() {
  const openCategories = useCategoryDrawerStore((state) => state.open);

  const { data: categories = [] } = useQuery({
    queryKey: ["top-nav-categories"],
    queryFn: () => categoriesApi.topNav(),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <nav className="hidden border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:block">
      <div className="mx-auto flex max-w-[1920px] items-center gap-1 overflow-x-auto">
        <div className="flex w-full">
          <button
            type="button"
            onClick={openCategories}
            className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <Menu className="h-4 w-4" />
            All
          </button>
          <div className="flex">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`${paths.products}?category=${category.id}`}
                className="flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                {category.name}
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </nav>
  );
}
