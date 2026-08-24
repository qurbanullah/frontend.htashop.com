import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/layouts/TopBar'

/**
 * Public storefront layout — top navigation plus page content.
 * The global footer is rendered by RootLayout.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
