import { authApi } from '@/api/auth'
import type { ApiResponse } from '@/lib/api-response'
import type { User } from '@/stores/auth'

export async function getCurrentUserAction(): Promise<ApiResponse<User>> {
  return authApi.getCurrentUser()
}
