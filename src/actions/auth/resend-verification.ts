import { authApi, type MessageResponse } from '@/api/auth'

export async function resendVerificationAction(email: string): Promise<MessageResponse> {
  return authApi.resendVerificationEmail(email)
}
