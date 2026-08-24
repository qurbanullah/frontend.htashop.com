import { AlertCircle, ArrowLeft, CheckCircle, Loader, Mail, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/Toaster'
import { authApi } from '@/lib/api'

export default function VerifyEmail() {
  const { success: showToast } = useToast()
  const [searchParams] = useSearchParams()

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const toastShownRef = useRef(false)

  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')
  const emailIdParam = searchParams.get('email_id')

  const verifyAccountEmail = useCallback(
    async (emailAddr: string, verificationToken: string) => {
      try {
        setStatus('verifying')
        setError('')
        const data = await authApi.verifyEmail(verificationToken, emailAddr)
        if (data.success) {
          setEmail(emailAddr)
          setStatus('success')
          if (!toastShownRef.current) {
            toastShownRef.current = true
            showToast('Email verified successfully!')
          }
        } else {
          setStatus('error')
          setError(data.message || 'Verification failed')
        }
      } catch (err: unknown) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    },
    [showToast]
  )

  const verifyAdditionalEmail = useCallback(
    async (verificationToken: string, emailId: number) => {
      try {
        setStatus('verifying')
        setError('')
        const data = await authApi.verifyEmail(verificationToken, String(emailId))
        if (data.success) {
          setStatus('success')
          if (!toastShownRef.current) {
            toastShownRef.current = true
            showToast('Email verified successfully!')
          }
        } else {
          setStatus('error')
          setError(data.message || 'Verification failed')
        }
      } catch (err: unknown) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    },
    [showToast]
  )

  // Auto-verify if token is present
  useEffect(() => {
    if (token && emailIdParam) {
      verifyAdditionalEmail(token, Number(emailIdParam))
    } else if (token && emailParam) {
      verifyAccountEmail(emailParam, token)
    } else if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [emailParam, verifyAdditionalEmail, token, verifyAccountEmail, emailIdParam])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (!email || isResending || resendCooldown > 0) return
    try {
      setIsResending(true)
      const data = await authApi.resendVerificationEmail(email)
      if (data.success) {
        setResendCooldown(60)
        showToast('Verification email resent!')
      } else {
        setError(data.message || 'Failed to resend email')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend email')
    } finally {
      setIsResending(false)
    }
  }

  const statusIcon = {
    verifying: <Loader className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400" />,
    success: <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />,
    error: <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />,
    pending: <Mail className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
  }[status]

  const statusTitle = {
    verifying: 'Verifying your email…',
    success: 'Email verified!',
    error: 'Verification failed',
    pending: 'Verify your email',
  }[status]

  const statusDescription = {
    verifying: '',
    success: 'You can now sign in to your account.',
    error,
    pending: 'Enter your email to resend the verification link.',
  }[status]

  return (
    <>
      {/* Back link */}
      <div className="mb-6 text-center sm:text-left">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-medium text-gray-500 text-sm hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <Logo width={120} />
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-gray-200/50 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
        <div className="px-8 py-8">
          {/* Status icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            {statusIcon}
          </div>

          <h1 className="mb-2 text-center font-semibold text-gray-900 text-xl dark:text-white">
            {statusTitle}
          </h1>

          <p className="mb-6 text-center text-gray-500 text-sm dark:text-gray-400">
            {statusDescription}
          </p>

          {/* Success state */}
          {status === 'success' && (
            <Link to="/login">
              <Button className="h-11 w-full bg-gradient-to-r from-blue-600 to-blue-700 font-medium text-white">
                Sign in to your account
              </Button>
            </Link>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div>
              <Link to="/login">
                <Button variant="outline" className="h-11 w-full">
                  Back to login
                </Button>
              </Link>
            </div>
          )}

          {/* Pending state — resend form */}
          {status === 'pending' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="verify-email"
                  className="font-medium text-gray-700 text-sm dark:text-gray-300"
                >
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="verify-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 bg-gray-50 pl-10 focus:bg-white dark:bg-gray-900 dark:focus:bg-gray-800"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {error}
                </div>
              )}

              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0 || !email}
                className="h-11 w-full bg-gradient-to-r from-blue-600 to-blue-700 font-medium text-white shadow-blue-600/20 shadow-md"
              >
                {isResending ? (
                  <span className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Sending…
                  </span>
                ) : resendCooldown > 0 ? (
                  <span className="flex items-center gap-2">Resend in {resendCooldown}s</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Resend verification email
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
