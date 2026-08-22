import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  XCircle,
  UserCheck,
  LogIn,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { Logo } from "@/components/shared/Logo";

const checkAccountSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type CheckAccountForm = z.infer<typeof checkAccountSchema>;

interface AccountCheckResult {
  exists: boolean;
  message: string;
}

export default function CheckAccount() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AccountCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckAccountForm>({
    resolver: zodResolver(checkAccountSchema),
  });

  const onSubmit = async (data: CheckAccountForm) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await api
        .post("check-account", {
          json: { email: data.email },
        })
        .json<AccountCheckResult>();

      setResult(response);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to check account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="-mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-3"
          >
            <div className="dark:hidden">
            <Logo width={120} />
            </div>
          </Link>
          {/* <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Journal Management System</p> */}
        </div>

        <Card className="overflow-hidden bg-white border-2 border-blue-200 shadow-2xl dark:border-blue-900/50 dark:bg-gray-800">
          <CardHeader className="pb-5 bg-linear-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center justify-center mx-auto mb-3 bg-white rounded-full shadow-lg w-14 h-14 dark:bg-gray-800">
              <UserCheck className="text-blue-600 w-7 h-7 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Find Your Account
            </CardTitle>
            <CardDescription className="text-sm text-center text-gray-900 dark:text-white">
              Check if your email is registered in our system
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pt-6 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 text-sm border-2 border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <svg
                    className="w-5 h-5 text-red-600 shrink-0 dark:text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-red-700 dark:text-red-300">
                    {error}
                  </span>
                </div>
              )}

              {/* Result Message */}
              {result && (
                <div
                  className={`flex items-start gap-3 px-4 py-4 border-2 rounded-lg ${
                    result.exists
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                      : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                  }`}
                >
                  {result.exists ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-semibold mb-1 ${
                        result.exists
                          ? "text-emerald-900 dark:text-emerald-100"
                          : "text-amber-900 dark:text-amber-100"
                      }`}
                    >
                      {result.message}
                    </p>
                    {/* {result.exists && result.name && (
                      <div className="mt-2 space-y-1 text-sm text-emerald-800 dark:text-emerald-200">
                        <p>
                          <span className="font-medium">Account Name:</span> {result.name}
                        </p>
                        {result.registered_at && (
                          <p>
                            <span className="font-medium">Registered:</span> {result.registered_at}
                          </p>
                        )}
                      </div>
                    )} */}
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200"
                >
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    {...register("email")}
                    className={`pl-10 h-11 text-base border-2 transition-all ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600"
                    }`}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-slate-400 dark:text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="relative w-full overflow-hidden text-base font-semibold text-white transition-all bg-blue-600 shadow-lg h-11 hover:bg-blue-700 hover:shadow-xl dark:bg-blue-600 dark:hover:bg-blue-700 group"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    Checking Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserCheck className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                    Check Account Status
                  </div>
                )}
              </Button>
            </form>

            {/* Action Buttons - Show after result */}
            {result && (
              <>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 dark:bg-gray-800 dark:text-slate-400">
                      What's next?
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.exists ? (
                    <>
                      {/* Go to Login */}
                      <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700 group"
                      >
                        <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        Go to Login
                      </Link>
                      {/* Forgot Password */}
                      <Link
                        to="/forgot-password"
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-2 rounded-lg text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                        Forgot Your Password?
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* Create Account */}
                      <Link
                        to="/register"
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all rounded-lg shadow-md bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg dark:bg-emerald-600 dark:hover:bg-emerald-700 group"
                      >
                        <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                        Create New Account
                      </Link>
                      {/* Try Another Email */}
                      <button
                        type="button"
                        onClick={() => setResult(null)}
                        className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium transition-all border-2 rounded-lg text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Mail className="w-5 h-5" />
                        Try Another Email
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Additional Help */}
            {!result && (
              <div className="p-4 mt-6 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-200">
                    Need help?
                  </span>
                  <br />
                  Enter your email address to verify if you're registered in the
                  system.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
