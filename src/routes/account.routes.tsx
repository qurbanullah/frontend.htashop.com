import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { AccountLayout } from '@/components/account/AccountLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { paths } from '@/routes/paths'

const AccountOverviewPage = lazy(() => import('@/pages/account/AccountOverviewPage'))
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage'))
const AddressesPage = lazy(() => import('@/pages/account/AddressesPage'))
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage'))
const SecurityPage = lazy(() => import('@/pages/account/SecurityPage'))
const PrivacyPage = lazy(() => import('@/pages/account/PrivacyPage'))

/**
 * Buyer account area — keeps the storefront top bar visible and adds an
 * account-specific left navigation (Amazon-style "Your Account").
 */
export function AccountRoutes() {
  return (
    <Route element={<ProtectedRoute />}>
      <Route element={<AccountLayout />}>
        <Route path={paths.account} element={<AccountOverviewPage />} />
        <Route path={paths.accountOrders} element={<OrdersPage />} />
        <Route path={paths.accountOrderDetail} element={<OrderDetailPage />} />
        <Route path={paths.accountAddresses} element={<AddressesPage />} />
        <Route path={paths.accountProfile} element={<ProfilePage />} />
        <Route path={paths.accountSecurity} element={<SecurityPage />} />
        <Route path={paths.accountPrivacy} element={<PrivacyPage />} />
      </Route>
    </Route>
  )
}
