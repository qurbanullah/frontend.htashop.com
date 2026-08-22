import type { ReactNode } from "react";
import { useEffect } from "react";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import OfflineBanner from "@/components/shared/OfflineBanner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToasterProvider } from "@/components/ui/Toaster";
import { Footer } from "@/components/shared/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CategoryDrawer } from "@/components/layouts/leftbar/CategoryDrawer";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";

interface RootLayoutProps {
  children: ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    useCartStore.getState().sync();
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <ThemeProvider>
        <ToasterProvider>
          <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-1 flex-col">
              {children}
            </div>
            <Footer />
          </div>
          <CartDrawer />
          <CategoryDrawer />
        </ToasterProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
