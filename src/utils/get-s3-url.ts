import { storageApi } from '@/api/storage'
import { S3UrlCache } from './s3-url-cache'

/**
 * Get a pre-signed S3 download URL with automatic caching.
 * Uses the standardized storageApi (ky client) — no raw fetch.
 */
export async function getS3Url(s3Key: string, expiresIn = 3600): Promise<string | null> {
  const cachedUrl = S3UrlCache.get(s3Key)
  if (cachedUrl) return cachedUrl

  try {
    const data = await storageApi.generateDownloadUrl(s3Key, expiresIn)

    if (data.success && data.data?.url) {
      S3UrlCache.set(s3Key, data.data.url, expiresIn - 300)
      return data.data.url
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get multiple S3 URLs in parallel.
 */
export async function getS3Urls(keys: string[], expiresIn = 3600): Promise<Record<string, string>> {
  const results = await Promise.allSettled(keys.map((key) => getS3Url(key, expiresIn)))

  const urlMap: Record<string, string> = {}
  results.forEach((result, index) => {
    const key = keys[index]
    if (key && result.status === 'fulfilled' && result.value) {
      urlMap[key] = result.value
    }
  })

  return urlMap
}
