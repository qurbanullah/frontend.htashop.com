import { Suspense } from 'react'
import { Routes } from 'react-router-dom'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
import { RootLayout } from '@/components/layouts/RootLayout'
import { DeepLinkHandler } from '@/components/shared/DeepLinkHandler'
import { PageSpinner } from '@/components/shared/PageSpinner'
import { ScrollRestoration } from '@/components/shared/ScrollRestoration'
import { AccountRoutes } from '@/routes/account.routes'
import { AuthRoutes } from '@/routes/auth.routes'
import { PublicRoutes } from '@/routes/public.routes'

export function AppRouter() {
  return (
    <>
      <ScrollRestoration />
      <DeepLinkHandler />
      <RootLayout>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            {AuthRoutes()}
            {AccountRoutes()}
            {PublicRoutes()}
          </Routes>
        </Suspense>
      </RootLayout>
      {/* After the layout, so page <Seo> effects have set document.title. */}
      <PageViewTracker />
    </>
  )
}
