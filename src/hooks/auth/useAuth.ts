import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAccountAction } from '@/actions/auth/check-account'
import { getCurrentUserAction } from '@/actions/auth/get-current-user'
import { loginAction } from '@/actions/auth/login'
import { logoutAction } from '@/actions/auth/logout'
import { registerAction } from '@/actions/auth/register'
import { resendVerificationAction } from '@/actions/auth/resend-verification'
import { verifyEmailAction } from '@/actions/auth/verify-email'
import type { LoginRequest, RegisterRequest } from '@/api/auth'
import i18n from '@/i18n/config'
import { isApiError } from '@/lib/api-response'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth'

// Every fallback below is resolved lazily through i18n, so a message set at the
// moment of failure is rendered in whichever language is active then.
function t(key: string): string {
  return i18n.t(key)
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || fallback
  return fallback
}

/**
 * Shared error handling for auth flows — surfaces validation errors when the
 * API returns them, otherwise shows a general message.
 */
function handleAuthError(
  error: unknown,
  setError: (message: string) => void,
  setValidationErrors: (errors: Record<string, string[]> | null) => void,
  fallback: string,
  networkFallback: string
): string {
  if (isApiError(error)) {
    if (error.errors) {
      setValidationErrors(error.errors)
    } else {
      setError(error.message || fallback)
    }
  } else {
    console.error('Auth error:', error)
    setError(networkFallback)
  }
  return getErrorMessage(error, fallback)
}

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    login,
    logout,
    setLoading,
    setError,
    clearError,
    updateUser,
    user,
    isAuthenticated,
    isLoading,
    error,
  } = useAuthStore()

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null)
  const [emailExists, setEmailExists] = useState(false)

  const handleLogin = async (credentials: LoginRequest) => {
    try {
      setLoading(true)
      clearError()
      setValidationErrors(null)

      const response = await loginAction(credentials)

      if (response.success) {
        login(response.user)
        navigate(paths.account, { replace: true })
        return { success: true }
      }
      setError(t('login.error_retry'))
      return { success: false, message: t('login.error_retry') }
    } catch (error: unknown) {
      if (isApiError(error) && error.requiresEmailVerification && error.email) {
        navigate(`/verify-email?email=${encodeURIComponent(error.email)}`, { replace: true })
        return { success: false, message: 'email_verification_required' }
      }
      const message = handleAuthError(
        error,
        setError,
        setValidationErrors,
        t('login.error_generic'),
        t('auth.common.error_network')
      )
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (userData: RegisterRequest) => {
    try {
      setLoading(true)
      clearError()
      setValidationErrors(null)
      setEmailExists(false)

      const accountCheck = await checkAccountAction(userData.email, userData.turnstileToken)
      if (accountCheck.exists) {
        setEmailExists(true)
        setValidationErrors({ email: [t('register.email_taken')] })
        return { success: false, message: t('register.email_taken') }
      }

      const response = await registerAction(userData)
      if (response.success) {
        navigate(`/verify-email?email=${encodeURIComponent(response.user.email)}`, {
          replace: true,
        })
        return { success: true }
      }
      setError(t('register.error_retry'))
      return { success: false, message: t('register.error_retry') }
    } catch (error: unknown) {
      if (isApiError(error) && error.emailExists) {
        setEmailExists(true)
        return { success: false, message: t('register.email_taken') }
      }
      const message = handleAuthError(
        error,
        setError,
        setValidationErrors,
        t('register.error_generic'),
        t('auth.common.error_network')
      )
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      try {
        await logoutAction()
      } catch {
        /* ignore */
      }
      logout()
      queryClient.clear()
      navigate('/login', { replace: true })
      return { success: true }
    } catch (error: unknown) {
      console.error('Logout error:', error)
      logout()
      queryClient.clear()
      navigate('/login', { replace: true })
      // Callers ignore the message; a local session is already gone either way.
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUser = async () => {
    try {
      setLoading(true)
      const response = await getCurrentUserAction()
      if (response.success && response.data) {
        updateUser(response.data)
        return { success: true, user: response.data }
      }
      setError(t('auth.common.error_fetch_user'))
      return { success: false }
    } catch (error: unknown) {
      console.error('Get user error:', error)
      setError(t('auth.common.error_fetch_user'))
      return { success: false, message: getErrorMessage(error, t('auth.common.error_fetch_user')) }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (token: string, email: string) => {
    try {
      setLoading(true)
      clearError()
      const response = await verifyEmailAction(token, email)
      if (response.success) return { success: true, message: response.message }
      setError(response.message || t('verify_email.failed'))
      return { success: false, message: response.message }
    } catch (error: unknown) {
      console.error('Email verification error:', error)
      setError(t('verify_email.failed'))
      return { success: false, message: getErrorMessage(error, t('verify_email.failed')) }
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      setLoading(true)
      clearError()
      const response = await resendVerificationAction(email)
      if (response.success) return { success: true, message: response.message }
      setError(response.message || t('verify_email.error_resend'))
      return { success: false, message: response.message }
    } catch (error: unknown) {
      console.error('Resend verification error:', error)
      setError(t('verify_email.error_resend'))
      return {
        success: false,
        message: getErrorMessage(error, t('verify_email.error_resend')),
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    validationErrors,
    emailExists,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    getCurrentUser,
    verifyEmail,
    resendVerificationEmail,
    clearError,
    clearEmailExists: () => setEmailExists(false),
    clearValidationErrors: () => setValidationErrors(null),
  }
}
