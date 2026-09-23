import { QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import './i18n/config' // Initialize i18n
import { queryClient } from '@/lib/query-client'
import { useConsentStore } from '@/stores/consent' // Initialize consent store
import { applyConsent } from './lib/consent/analytics'
import { validateEnvironment } from './lib/env' // Environment validation
import { isNativePlatform } from './lib/native'
import { initNativeApp } from './lib/native-app'

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

// Remove the web loading spinner. On native, the splash screen already covers
// the initial load, so remove the spinner immediately (the splash is hidden in
// initNativeApp after React mounts).
const loadingEl = document.getElementById('loading')
if (isNativePlatform()) {
  loadingEl?.remove()
} else if (loadingEl) {
  setTimeout(() => {
    loadingEl.style.opacity = '0'
    loadingEl.style.transition = 'opacity 0.2s ease-out'
    setTimeout(() => {
      loadingEl.remove()
    }, 200)
  }, 800)
}

const root = ReactDOM.createRoot(getRootElement())
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

// Initialize native-only features (status bar, push, deep links) and hide the
// native splash screen. No-op when running in a browser.
void initNativeApp()
