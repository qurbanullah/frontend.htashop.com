import { useQuery } from "@tanstack/react-query";
import { bannersApi, type Banner } from "@/api/banners";

export interface BannerContext {
  categoryId?: number;
  q?: string;
}

/**
 * Resolves active banners for a placement + context (category / search).
 * Cached for 10 minutes — banners change rarely and are cheap to serve.
 */
export function useBanners(placement: string, context?: BannerContext) {
  return useQuery({
    queryKey: ["banners", placement, context?.categoryId ?? null, context?.q ?? ""],
    queryFn: () =>
      bannersApi.list({
        placement,
        category_id: context?.categoryId,
        q: context?.q,
      }),
    staleTime: 10 * 60 * 1000,
    placeholderData: (prev: Banner[] | undefined) => prev,
  });
}
