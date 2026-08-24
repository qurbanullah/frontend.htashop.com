import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import './i18n/config' // Initialize i18n
import { applyConsent } from './lib/consent/analytics'
import { validateEnvironment } from './lib/env' // Environment validation
import { useAuthStore } from './stores/auth' // Initialize auth store
import { useConsentStore } from './stores/consent' // Initialize consent store

// GDPR: gate all non-essential trackers (Sentry, GA4, Meta Pixel) behind the
// user's stored consent choice. This runs before first paint; the live
// re-evaluation happens in ConsentManager when the user changes preferences.
void applyConsent(useConsentStore.getState().categories)

function getRootElement(): HTMLElement {
  const el = document.getElementById('root')
  if (!el) throw new Error('Root element not found')
  return el
}

// Validate environment before anything else
try {
  validateEnvironment()
} catch (error) {
  console.error('Fatal: Environment validation failed', error)
  // Show error to user using textContent (not innerHTML) to prevent XSS
  const root = getRootElement()
  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;background:linear-gradient(to bottom right,#f8fafc,#e0f2fe)'
  const card = document.createElement('div')
  card.style.cssText =
    'max-width:500px;padding:2rem;background:white;border-radius:0.5rem;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)'
  const heading = document.createElement('h1')
  heading.style.cssText = 'color:#dc2626;font-size:1.5rem;font-weight:bold;margin-bottom:1rem'
  heading.textContent = 'Configuration Error'
  const msg = document.createElement('p')
  msg.style.cssText = 'color:#475569;margin-bottom:1rem'
  msg.textContent =
    error instanceof Error ? error.message : 'Application is not properly configured.'
  const hint = document.createElement('p')
  hint.style.cssText = 'color:#64748b;font-size:0.875rem'
  hint.textContent = 'Please contact support or try again later.'
  card.appendChild(heading)
  card.appendChild(msg)
  card.appendChild(hint)
  wrapper.appendChild(card)
  root.appendChild(wrapper)
  throw error
}

// Initialize auth store
useAuthStore.getState().initialize()

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    },
    mutations: {
      retry: 0, // never retry mutations — avoid duplicate submissions
    },
  },
})

// Simple loading screen removal — overflow-y:scroll on html already reserves scrollbar space
const loadingEl = document.getElementById('loading')
if (loadingEl) {
  setTimeout(() => {
    loadingEl.style.opacity = '0'
    loadingEl.style.transition = 'opacity 0.2s ease-out'
    setTimeout(() => {
      loadingEl.remove()
    }, 200)
  }, 800)
}

ReactDOM.createRoot(getRootElement()).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
