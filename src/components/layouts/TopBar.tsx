import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/api/categories'
import { CategoryNav } from '@/components/layouts/topbar/CategoryTopNav'
import { TopSearchBar } from '@/components/layouts/topbar/TopSearchBar'

export function TopBar() {
  const { data: categories = [] } = useQuery({
    queryKey: ['storefront-categories'],
    queryFn: () => categoriesApi.tree(),
    staleTime: 10 * 60 * 1000,
  })

  return (
    <header className="sticky top-0 z-30">
      <TopSearchBar categories={categories} />
      <CategoryNav />
    </header>
  )
}
