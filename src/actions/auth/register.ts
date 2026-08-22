import { authApi, type RegisterRequest, type NormalizedAuthResponse } from "@/api/auth";

export async function registerAction(userData: RegisterRequest): Promise<NormalizedAuthResponse> {
  return authApi.register(userData);
}
