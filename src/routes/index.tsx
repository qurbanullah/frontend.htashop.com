import { Suspense } from "react";
import { Routes } from "react-router-dom";
import { AuthRoutes } from "@/routes/auth.routes";
import { AccountRoutes } from "@/routes/account.routes";
import { PublicRoutes } from "@/routes/public.routes";
import { RootLayout } from "@/components/layouts/RootLayout";
import { PageSpinner } from "@/components/shared/PageSpinner";

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
  );
}
