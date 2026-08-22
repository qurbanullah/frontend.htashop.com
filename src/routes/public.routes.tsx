import { lazy } from "react";
import { Route } from "react-router-dom";
import { paths } from "@/routes/paths";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { PublicLayout } from "@/components/layouts/PublicLayout";

const HomePage = lazy(() => import("@/pages/public/HomePage"));
const ProductSearchPage = lazy(() => import("@/pages/public/ProductSearchPage"));
const ProductDetailPage = lazy(() => import("@/pages/public/ProductDetailPage"));
const CheckoutPage = lazy(() => import("@/pages/public/CheckoutPage"));
const OrderConfirmationPage = lazy(() => import("@/pages/public/OrderConfirmationPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/public/legal/PrivacyPolicyPage"));
const TermsOfUsePage = lazy(() => import("@/pages/public/legal/TermsOfUsePage"));
const CookiesPolicyPage = lazy(() => import("@/pages/public/legal/CookiesPolicyPage"));
const RefundPolicyPage = lazy(() => import("@/pages/public/legal/RefundPolicyPage"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const NotFound = lazy(() => import("@/pages/error/NotFound"));

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
        <Route path={paths.checkout} element={<CheckoutPage />} />
        <Route path={`${paths.orderConfirmation}/:uuid/confirmation`} element={<OrderConfirmationPage />} />
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
  );
}
