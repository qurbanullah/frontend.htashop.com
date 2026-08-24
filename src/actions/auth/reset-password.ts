import { authApi, type MessageResponse } from '@/api/auth'

export async function resetPasswordAction(data: {
  token: string
  email: string
  password: string
  password_confirmation: string
}): Promise<MessageResponse> {
  return authApi.resetPassword(data)
}
