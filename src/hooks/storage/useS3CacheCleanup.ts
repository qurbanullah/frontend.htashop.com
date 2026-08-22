import { useEffect } from "react";
import { S3UrlCache } from "@/utils/s3-url-cache";

export function useS3CacheCleanup() {
  useEffect(() => {
    S3UrlCache.clearExpired();
    const intervalId = setInterval(() => S3UrlCache.clearExpired(), 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);
}
