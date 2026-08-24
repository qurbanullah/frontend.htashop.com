import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  useForm,
} from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormViewProps {
  register: UseFormRegister<ResetPasswordForm>
  errors: FieldErrors<ResetPasswordForm>
  handleSubmit: UseFormHandleSubmit<ResetPasswordForm>
  onSubmit: (data: ResetPasswordForm) => Promise<void>
  email: string | null
  token: string | null
  error: string | null
  loading: boolean
  showPassword: boolean
  showConfirmPassword: boolean
  setShowPassword: (v: boolean) => void
  setShowConfirmPassword: (v: boolean) => void
}

function ResetPasswordFormView({
  register,
  errors,
  handleSubmit,
  onSubmit,
  email,
  token,
  error,
  loading,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
}: ResetPasswordFormViewProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-800 dark:bg-red-900/20">
          <svg
            className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Email Display */}
      {email && !error && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-slate-600 text-sm dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-slate-200">
              Resetting password for:
            </span>
            <br />
            <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span>
          </p>
        </div>
      )}

      {/* Password Input */}
      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200"
        >
          <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          New Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            {...register('password')}
            className={`h-11 border-2 pr-12 pl-10 text-base transition-all ${
              errors.password
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'
            }`}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            ) : (
              <Eye className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="flex items-center gap-1 text-red-600 text-sm dark:text-red-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <Label
          htmlFor="password_confirmation"
          className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200"
        >
          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Confirm New Password
        </Label>
        <div className="relative">
          <Input
            id="password_confirmation"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your new password"
            {...register('password_confirmation')}
            className={`h-11 border-2 pr-12 pl-10 text-base transition-all ${
              errors.password_confirmation
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'
            }`}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            ) : (
              <Eye className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            )}
          </button>
        </div>
        {errors.password_confirmation && (
          <p className="flex items-center gap-1 text-red-600 text-sm dark:text-red-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.password_confirmation.message}
          </p>
        )}
      </div>

      {/* Password Requirements */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="mb-2 font-medium text-slate-900 text-sm dark:text-slate-200">
          Password Requirements:
        </p>
        <ul className="space-y-1 text-slate-600 text-xs dark:text-slate-400">
          <li className="flex items-center gap-2">
            <svg
              className="h-3 w-3 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            At least 8 characters long
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="h-3 w-3 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Both passwords must match
          </li>
        </ul>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="group relative h-11 w-full overflow-hidden bg-blue-600 font-semibold text-base text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl dark:bg-blue-600 dark:hover:bg-blue-700"
        disabled={loading || !token || !email || !!error}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Resetting Password...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <KeyRound className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
            Reset Password
          </div>
        )}
      </Button>

      {/* Additional Links */}
      <div className="border-slate-200 border-t-2 pt-4 text-center dark:border-slate-700">
        <p className="text-slate-600 text-sm dark:text-slate-400">
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </form>
  )
}

function ResetSuccessView() {
  return (
    <div className="space-y-5">
      {/* Success Message */}
      <div className="flex items-start gap-3 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800 dark:bg-emerald-900/20">
        <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="flex-1">
          <p className="mb-1 font-semibold text-emerald-900 dark:text-emerald-100">All Set!</p>
          <p className="text-emerald-800 text-sm dark:text-emerald-200">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
        </div>
      </div>

      {/* Auto Redirect Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
        <p className="text-center text-blue-900 text-sm dark:text-blue-100">
          <span className="font-medium">Redirecting to login...</span>
          <br />
          You will be automatically redirected in a few seconds.
        </p>
      </div>

      {/* Manual Login Button */}
      <Link
        to="/login"
        className="group flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-sm text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        <svg
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
        Go to Login Now
      </Link>
    </div>
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing reset link. Please request a new password reset.')
    }
  }, [token, email])

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token || !email) {
      setError('Invalid reset link')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await authApi.resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        {/* Back Link */}
        {!success && (
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-2 font-medium text-slate-600 text-sm transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        )}

        {/* Header */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-3">
            <div className="dark:hidden">
              <Logo width={120} />
            </div>
          </Link>
        </div>

        <Card className="overflow-hidden border-2 border-blue-200 bg-white shadow-2xl dark:border-blue-900/50 dark:bg-gray-800">
          <CardHeader className="bg-linear-to-br from-slate-100 to-slate-200 pb-5 dark:from-gray-800 dark:to-gray-700">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg dark:bg-gray-800">
              {success ? (
                <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <KeyRound className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <CardTitle className="text-center font-bold text-2xl text-gray-900 dark:text-white">
              {success ? 'Password Reset Successful!' : 'Create New Password'}
            </CardTitle>
            <CardDescription className="text-center text-gray-900 text-sm dark:text-white">
              {success
                ? 'Your password has been successfully updated'
                : 'Enter a strong password to secure your account'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pt-6 pb-8">
            {success ? (
              <ResetSuccessView />
            ) : (
              <ResetPasswordFormView
                register={register}
                errors={errors}
                handleSubmit={handleSubmit}
                onSubmit={onSubmit}
                email={email}
                token={token}
                error={error}
                loading={loading}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                setShowPassword={setShowPassword}
                setShowConfirmPassword={setShowConfirmPassword}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
