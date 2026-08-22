import { lazy } from "react";
import { Route } from "react-router-dom";
import { paths } from "@/routes/paths";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { PublicRoute } from "@/components/auth/ProtectedRoute";

const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const CheckAccount = lazy(() => import("@/pages/auth/CheckAccount"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));

/**
 * Auth routes — public-only (redirect to dashboard if already logged in).
 */
export function AuthRoutes() {
  return (
    <Route element={<PublicRoute />}>
      <Route element={<AuthLayout />}>
        <Route path={paths.login} element={<Login />} />
        <Route path={paths.register} element={<Register />} />
        <Route path={paths.checkAccount} element={<CheckAccount />} />
        <Route path={paths.forgotPassword} element={<ForgotPassword />} />
        <Route path={paths.resetPassword} element={<ResetPassword />} />
      </Route>
    </Route>
  );
}
