import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  useForm,
} from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import TurnstileWidget from '@/components/auth/TurnstileWidget'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/auth/useAuth'

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

function applyValidationErrors(
  validationErrors: Record<string, string[]>,
  setFormError: (field: keyof RegisterFormData, options: { message?: string }) => void
): void {
  for (const [field, messages] of Object.entries(validationErrors)) {
    const message = messages[0]
    if (field === 'email' || field === 'password') {
      setFormError(field, { message })
    } else if (field === 'name') {
      setFormError('first_name', { message })
    }
  }
}

function inputErrorClass(hasError: boolean): string {
  return hasError ? 'border-red-500' : ''
}

interface RegisterFormFieldsProps {
  register: UseFormRegister<RegisterFormData>
  errors: FieldErrors<RegisterFormData>
  handleSubmit: UseFormHandleSubmit<RegisterFormData>
  onSubmit: (data: RegisterFormData) => void
  showPassword: boolean
  showConfirmPassword: boolean
  setShowPassword: (v: boolean) => void
  setShowConfirmPassword: (v: boolean) => void
  setTurnstileToken: (v: string | null) => void
  emailExists: boolean
  error: string | null
  isLoading: boolean
}

function RegisterFormFields({
  register,
  errors,
  handleSubmit,
  onSubmit,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  setTurnstileToken,
  emailExists,
  error,
  isLoading,
}: RegisterFormFieldsProps) {
  return (
    <>
      {/* Email already exists banner */}
      {emailExists && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <div>
            <p className="font-semibold">Account already exists</p>
            <p className="mt-0.5">
              An account with this email is already registered.{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Sign in instead →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !emailExists && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* First name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="first_name"
            className="font-medium text-gray-700 text-sm dark:text-gray-300"
          >
            First name
          </Label>
          <div className="relative">
            <User className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="first_name"
              type="text"
              placeholder="John"
              {...register('first_name')}
              className={`h-11 bg-gray-50 pl-10 focus:bg-white dark:bg-gray-900 dark:focus:bg-gray-800 ${inputErrorClass(Boolean(errors.first_name))}`}
            />
          </div>
          {errors.first_name && (
            <p className="text-red-600 text-sm dark:text-red-400">{errors.first_name.message}</p>
          )}
        </div>

        {/* Last name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="last_name"
            className="font-medium text-gray-700 text-sm dark:text-gray-300"
          >
            Last name
          </Label>
          <div className="relative">
            <User className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="last_name"
              type="text"
              placeholder="Doe"
              {...register('last_name')}
              className={`h-11 bg-gray-50 pl-10 focus:bg-white dark:bg-gray-900 dark:focus:bg-gray-800 ${inputErrorClass(Boolean(errors.last_name))}`}
            />
          </div>
          {errors.last_name && (
            <p className="text-red-600 text-sm dark:text-red-400">{errors.last_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-medium text-gray-700 text-sm dark:text-gray-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={`h-11 bg-gray-50 pl-10 focus:bg-white dark:bg-gray-900 dark:focus:bg-gray-800 ${inputErrorClass(Boolean(errors.email))}`}
            />
          </div>
          {errors.email && (
            <p className="text-red-600 text-sm dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="font-medium text-gray-700 text-sm dark:text-gray-300"
          >
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              {...register('password')}
              className={`h-11 bg-gray-50 pr-10 pl-10 focus:bg-white dark:bg-gray-900 dark:focus:bg-gray-800 ${inputErrorClass(Boolean(errors.password))}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 z-10 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-600 text-sm dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="password_confirmation"
            className="font-medium text-gray-700 text-sm dark:text-gray-300"
          >
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="password_confirmation"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              {...register('password_confirmation')}
              className={`h-11 bg-gray-50 pr-10 pl-10 focus:bg-white dark:bg-gray-900 dark:focus:bg-gray-800 ${inputErrorClass(Boolean(errors.password_confirmation))}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 z-10 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="text-red-600 text-sm dark:text-red-400">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        {/* Terms */}
        <p className="text-center text-gray-500 text-xs dark:text-gray-400">
          By creating an account, you agree to our{' '}
          <a
            href="https://htashop.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Terms
          </a>{' '}
          and{' '}
          <a
            href="https://htashop.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Privacy Policy
          </a>
        </p>

        {/* Turnstile */}
        <div className="flex justify-center">
          <TurnstileWidget onVerify={setTurnstileToken} />
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
              Creating account…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create account
            </span>
          )}
        </Button>
      </form>
    </>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const {
    register: registerUser,
    isLoading,
    error,
    validationErrors,
    emailExists,
    clearError,
    clearEmailExists,
    isAuthenticated,
  } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    watch,
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const emailValue = watch('email')

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!mountedRef.current) return
    if (validationErrors) {
      applyValidationErrors(validationErrors, setFormError)
    }
  }, [validationErrors, setFormError])

  useEffect(() => {
    if (!mountedRef.current || !emailValue) return
    clearEmailExists()
  }, [emailValue, clearEmailExists])

  const onSubmit = (data: RegisterFormData) => {
    clearError()
    registerUser({ ...data, turnstile_token: turnstileToken })
  }

  return (
    <>
      {/* Logo */}
      <div className="mb-8 text-center">
        <Logo width={64} />
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-gray-200/50 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
        <div className="px-8 py-8">
          <h1 className="mb-6 text-center font-semibold text-gray-900 text-xl dark:text-white">
            Create your account
          </h1>

          <RegisterFormFields
            register={register}
            errors={errors}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            setShowPassword={setShowPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            setTurnstileToken={setTurnstileToken}
            emailExists={emailExists}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Login link */}
      <p className="mt-6 text-center text-gray-500 text-sm dark:text-gray-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
