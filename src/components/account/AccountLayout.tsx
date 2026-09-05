import { Outlet } from 'react-router-dom'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { TopBar } from '@/components/layouts/TopBar'

/**
 * Buyer account shell-narrow — keeps the storefront top bar (search + categories)
 * visible and adds a left account navigation (Amazon-style "Your Account").
 */
export function AccountLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="shell-narrow mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <AccountSidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
