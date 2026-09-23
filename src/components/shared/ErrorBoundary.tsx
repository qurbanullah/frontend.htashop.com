import type React from 'react'
import { Component, type ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { COMPANY } from '@/lib/company'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Last-resort boundary for the whole storefront.
 *
 * Renders a self-contained fallback (inline styles only — the CSS bundle may be
 * what failed) and reports the error to Sentry. Sentry is loaded lazily and only
 * when error monitoring has been consented to, so a missing/disabled Sentry is a
 * silent no-op rather than a second failure.
 *
 * The parent mounts this with `key={location.pathname}` so navigating away from a
 * broken route resets the boundary without a full page reload.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    void import('@sentry/react')
      .then((Sentry) =>
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
      )
      .catch(() => {
        // Sentry unavailable or consent not granted — the console log above is enough.
      })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <h1
              style={{
                color: '#111827',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              <Trans i18nKey="error_boundary.title" />
            </h1>
            <p style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
              <Trans i18nKey="error_boundary.body" />
            </p>
            <p
              style={{
                color: '#4b5563',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
                fontSize: '0.875rem',
              }}
            >
              <Trans
                i18nKey="error_boundary.support"
                values={{ email: COMPANY.email }}
                components={{
                  // Children are injected by i18next from the translation string.
                  // biome-ignore lint/a11y/useAnchorContent: anchor text comes from the translation
                  email: <a href={`mailto:${COMPANY.email}`} style={{ color: '#2563eb' }} />,
                }}
              />
            </p>
            {import.meta.env.DEV && (
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  <Trans i18nKey="error_boundary.details" />
                </summary>
                <pre
                  style={{
                    background: '#f3f4f6',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                  }}
                >
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                <Trans i18nKey="error_boundary.retry" />
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                <Trans i18nKey="error_boundary.reload" />
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
