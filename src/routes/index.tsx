import { Suspense } from 'react'
import { Routes } from 'react-router-dom'
import { RootLayout } from '@/components/layouts/RootLayout'
import { PageSpinner } from '@/components/shared/PageSpinner'
import { AccountRoutes } from '@/routes/account.routes'
import { AuthRoutes } from '@/routes/auth.routes'
import { PublicRoutes } from '@/routes/public.routes'

export function AppRouter() {
  return (
    <RootLayout>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {AuthRoutes()}
          {AccountRoutes()}
          {PublicRoutes()}
        </Routes>
      </Suspense>
    </RootLayout>
  )
}
