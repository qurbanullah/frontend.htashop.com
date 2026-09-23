import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { ConsentManager } from '@/components/consent/ConsentManager'
import { CategoryDrawer } from '@/components/layouts/leftbar/CategoryDrawer'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import { Footer } from '@/components/shared/Footer'
import OfflineBanner from '@/components/shared/OfflineBanner'
import { SupportAssistantWidget } from '@/components/support/SupportAssistantWidget'
import { ToasterProvider } from '@/components/ui/Toaster'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

interface RootLayoutProps {
  children: ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  // Re-sync the cart when auth state changes (login/logout swaps the cart owner)
  // biome-ignore lint/correctness/useExhaustiveDependencies: isAuthenticated is an intentional effect trigger
  useEffect(() => {
    useCartStore.getState().sync()
  }, [isAuthenticated])

  return (
    // Keyed by path so navigating away from a route that threw resets the
    // boundary instead of leaving the user stuck on the fallback until reload.
    <ErrorBoundary key={location.pathname}>
      <OfflineBanner />
      <ThemeProvider>
        <ToasterProvider>
          <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
          </div>
          <CartDrawer />
          <CategoryDrawer />
          <ConsentManager />
          <SupportAssistantWidget />
        </ToasterProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
