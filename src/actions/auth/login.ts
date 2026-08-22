import { authApi, type LoginRequest, type NormalizedAuthResponse } from "@/api/auth";

export async function loginAction(credentials: LoginRequest): Promise<NormalizedAuthResponse> {
  return authApi.login(credentials);
}
