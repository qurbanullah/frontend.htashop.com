import { authApi, type NormalizedAuthResponse, type RegisterRequest } from '@/api/auth'

export async function registerAction(userData: RegisterRequest): Promise<NormalizedAuthResponse> {
  return authApi.register(userData)
}
