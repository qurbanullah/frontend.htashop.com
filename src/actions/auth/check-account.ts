import { type AccountCheckResponse, authApi } from '@/api/auth'

export async function checkAccountAction(
  email: string,
  turnstileToken?: string | null
): Promise<AccountCheckResponse> {
  return authApi.checkAccount(email, turnstileToken)
}
