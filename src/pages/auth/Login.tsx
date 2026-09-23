import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import TurnstileWidget from '@/components/auth/TurnstileWidget'
import { Seo } from '@/components/seo/Seo'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/auth/useAuth'
import { paths } from '@/routes/paths'

type Translate = (key: string) => string

// Built from `t` rather than at module scope so validation messages follow the
// active language.
function createLoginSchema(t: Translate) {
  return z.object({
    email: z.string().min(1, t('validation.email_required')).email(t('validation.email_invalid')),
    password: z.string().min(1, t('validation.password_required')),
  })
}

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('auth')

  // Return the user to the page ProtectedRoute sent them away from (it passes
  // `state.from`), instead of always dumping them on the account overview.
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? paths.account
  const { login, isLoading, error, validationErrors, clearError, isAuthenticated } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const loginSchema = useMemo(() => createLoginSchema(t), [t])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true })
  }, [isAuthenticated, navigate, redirectTo])

  useEffect(() => {
    if (!mountedRef.current) return
    if (validationErrors) {
      for (const [field, messages] of Object.entries(validationErrors)) {
        if (field === 'email' || field === 'password') {
          setFormError(field, { message: messages[0] })
        }
      }
    }
  }, [validationErrors, setFormError])

  const onSubmit = (data: LoginFormData) => {
    clearError()
    login({ ...data, turnstileToken })
  }

  return (
    <>
      <Seo title={t('seo.sign_in')} noindex />

      {/* Logo */}
      <div className="mb-8 text-center">
        <Logo width={64} />
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-gray-200/50 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
        <div className="px-8 py-8">
          <h1 className="mb-6 text-center font-semibold text-gray-900 text-xl dark:text-white">
            {t('login.title')}
          </h1>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="font-medium text-gray-700 text-sm dark:text-gray-300"
              >
                {t('common.email')}
              </Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('common.email_placeholder')}
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby="email-error"
                  className={`h-11 bg-gray-50 ps-10 focus:bg-white dark:bg-gray-900 dark:focus:bg-gray-800 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-red-600 text-sm dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="font-medium text-gray-700 text-sm dark:text-gray-300"
                >
                  {t('common.password')}
                </Label>
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 text-xs hover:text-blue-500 dark:text-blue-400"
                >
                  {t('login.forgot')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.password_placeholder')}
                  {...register('password')}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="password-error"
                  className={`h-11 bg-gray-50 ps-10 pe-10 focus:bg-white dark:bg-gray-900 dark:focus:bg-gray-800 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('common.hide_password') : t('common.show_password')}
                  className="absolute end-3 top-1/2 z-10 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-red-600 text-sm dark:text-red-400"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Turnstile */}
            <div className="flex justify-center">
              <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full bg-gradient-to-r from-blue-600 to-blue-700 font-medium text-base text-white shadow-blue-600/20 shadow-md hover:from-blue-700 hover:to-blue-800 dark:from-blue-600 dark:to-blue-700 dark:shadow-none dark:hover:from-blue-500 dark:hover:to-blue-600"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('login.submitting')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t('login.submit')}
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Register link */}
      <p className="mt-6 text-center text-gray-500 text-sm dark:text-gray-400">
        {t('login.no_account')}{' '}
        <Link
          to="/register"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          {t('login.create_one')}
        </Link>
      </p>
    </>
  )
}
