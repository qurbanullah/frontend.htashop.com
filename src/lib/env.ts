// Environment validation utility
// This checks if required environment variables are present

export const ENV_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
}

export function validateEnvironment() {
  const errors: string[] = []

  if (!ENV_CONFIG.API_URL) {
    errors.push('VITE_API_URL is not defined')
  }

  if (errors.length > 0) {
    console.error('❌ Environment Configuration Errors:')
    for (const error of errors) {
      console.error(`   - ${error}`)
    }

    // In production, show a user-friendly error
    if (ENV_CONFIG.PROD) {
      throw new Error(
        'Application is not properly configured. Please contact support. Error: Missing API configuration.'
      )
    }
  }
  if (errors.length === 0 && import.meta.env.DEV) {
    console.log('✅ Environment validated successfully')
    console.log(`   - API URL: ${ENV_CONFIG.API_URL}`)
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
