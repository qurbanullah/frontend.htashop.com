import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useEffect, useRef } from 'react'

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string) || ''

/**
 * Turnstile is bypassed in local development and whenever it is explicitly
 * disabled via `VITE_TURNSTILE_DISABLED=true`. This keeps local/CI flows free
 * of a real Cloudflare challenge. The backend must be configured to skip
 * Turnstile verification in those same environments (or accept the
 * `dev-bypass-token` placeholder).
 */
const IS_TURNSTILE_DISABLED =
  import.meta.env.DEV || import.meta.env.VITE_TURNSTILE_DISABLED === 'true'

/** Token emitted when Turnstile is bypassed (never sent in production). */
export const TURNSTILE_BYPASS_TOKEN = 'dev-bypass-token'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onError?: () => void
}

export default function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const ref = useRef<TurnstileInstance>(null)
  const emittedRef = useRef(false)

  useEffect(() => {
    if (IS_TURNSTILE_DISABLED && !emittedRef.current) {
      emittedRef.current = true
      onVerify(TURNSTILE_BYPASS_TOKEN)
    }
  }, [onVerify])

  if (IS_TURNSTILE_DISABLED) return null

  if (!SITE_KEY) {
    console.warn('TurnstileWidget: VITE_TURNSTILE_SITE_KEY is not set')
    return null
  }

  return (
    <Turnstile
      ref={ref}
      siteKey={SITE_KEY}
      onSuccess={(token) => onVerify(token)}
      onError={onError}
      options={{ theme: 'auto', size: 'normal' }}
    />
  )
}
