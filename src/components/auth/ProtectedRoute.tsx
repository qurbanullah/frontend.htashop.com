import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { paths } from "@/routes/paths";

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) return <Outlet />;
  if (!isAuthenticated) return <Navigate to={paths.login} state={{ from: location }} replace />;

  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) return <Outlet />;
  if (isAuthenticated) return <Navigate to={paths.account} replace />;

  return <Outlet />;
}
