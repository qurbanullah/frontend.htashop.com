import { Fragment, lazy } from 'react'
import { Route } from 'react-router-dom'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { POST_SECTIONS } from '@/lib/post-sections'
import { paths } from '@/routes/paths'

const HomePage = lazy(() => import('@/pages/public/HomePage'))
const ProductSearchPage = lazy(() => import('@/pages/public/ProductSearchPage'))
const ProductDetailPage = lazy(() => import('@/pages/public/ProductDetailPage'))
const PostListPage = lazy(() => import('@/pages/public/PostListPage'))
const PostDetailPage = lazy(() => import('@/pages/public/PostDetailPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))
const FeedbackPage = lazy(() => import('@/pages/public/FeedbackPage'))
const UnsubscribePage = lazy(() => import('@/pages/public/UnsubscribePage'))
const CheckoutPage = lazy(() => import('@/pages/public/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('@/pages/public/OrderConfirmationPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/public/legal/PrivacyPolicyPage'))
const TermsOfUsePage = lazy(() => import('@/pages/public/legal/TermsOfUsePage'))
const CookiesPolicyPage = lazy(() => import('@/pages/public/legal/CookiesPolicyPage'))
const RefundPolicyPage = lazy(() => import('@/pages/public/legal/RefundPolicyPage'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))
const NotFound = lazy(() => import('@/pages/error/NotFound'))

/**
 * Public routes — no auth guard, no redirect.
 */
export function PublicRoutes() {
  return (
    <>
      <Route element={<PublicLayout />}>
        <Route path={paths.home} element={<HomePage />} />
        <Route path={paths.products} element={<ProductSearchPage />} />
        <Route path={`${paths.products}/:slugUuid`} element={<ProductDetailPage />} />

        {/* One list + detail route per public content section (POST_SECTIONS). */}
        {POST_SECTIONS.map((section) => (
          <Fragment key={section.type}>
            <Route path={section.path} element={<PostListPage section={section} />} />
            <Route path={`${section.path}/:slug`} element={<PostDetailPage />} />
          </Fragment>
        ))}

        <Route path={paths.contact} element={<ContactPage />} />
        <Route path={paths.feedback} element={<FeedbackPage />} />
        <Route path={paths.unsubscribe} element={<UnsubscribePage />} />
        <Route path={paths.checkout} element={<CheckoutPage />} />
        <Route
          path={`${paths.orderConfirmation}/:uuid/confirmation`}
          element={<OrderConfirmationPage />}
        />
        <Route path={paths.policiesPrivacy} element={<PrivacyPolicyPage />} />
        <Route path={paths.policiesTerms} element={<TermsOfUsePage />} />
        <Route path={paths.policiesCookies} element={<CookiesPolicyPage />} />
        <Route path={paths.policiesRefund} element={<RefundPolicyPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path={paths.verifyEmail} element={<VerifyEmail />} />
      </Route>
    </>
  )
}
