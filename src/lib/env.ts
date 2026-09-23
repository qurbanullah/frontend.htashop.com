// Environment validation utility
// This checks if required environment variables are present

export const ENV_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL,
  /** Canonical site origin (must match the backend FRONTEND_URL). */
  SITE_URL: ((import.meta.env.VITE_SITE_URL as string) || 'https://htashop.com').replace(
    /\/+$/,
    ''
  ),
  SITE_NAME: (import.meta.env.VITE_SITE_NAME as string) || 'HTAShop',
  /** Media CDN origin used to resolve stored asset keys. */
  CDN_URL: ((import.meta.env.VITE_CDN_URL as string) || 'https://cdn.htashop.com').replace(
    /\/+$/,
    ''
  ),
  /** Optional 1200×630 social share card used when a page supplies no image. */
  DEFAULT_OG_IMAGE: (import.meta.env.VITE_DEFAULT_OG_IMAGE as string) || '',
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
}

export function validateEnvironment() {
  const errors: string[] = []

  if (!ENV_CONFIG.API_URL) {
    errors.push('VITE_API_URL is not defined')
  }

  // The canonical site origin must be explicit in production so canonical
  // tags and sitemaps always agree with the backend FRONTEND_URL.
  if (!import.meta.env.VITE_SITE_URL) {
    errors.push('VITE_SITE_URL is not defined')
  }

  if (errors.length > 0) {
    console.error('❌ Environment Configuration Errors:')
    for (const error of errors) {
      console.error(`   - ${error}`)
    }

    // In production, show a user-friendly error
    if (ENV_CONFIG.PROD) {
      throw new Error(
        `Application is not properly configured. Please contact support. Errors: ${errors.join(', ')}`
      )
    }
  }
  if (errors.length === 0 && import.meta.env.DEV) {
    console.log('✅ Environment validated successfully')
    console.log(`   - API URL: ${ENV_CONFIG.API_URL}`)
    console.log(`   - Site URL: ${ENV_CONFIG.SITE_URL}`)
    console.log(`   - Mode: ${ENV_CONFIG.MODE}`)
  }

  return errors.length === 0
}

// Get API URL with fallback and validation
export function getApiUrl(): string {
  const apiUrl = ENV_CONFIG.API_URL

  if (!apiUrl) {
    throw new Error('API URL is not configured. Please contact support.')
  }

  return apiUrl
}
