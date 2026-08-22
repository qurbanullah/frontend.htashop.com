import { authApi, type AccountCheckResponse } from "@/api/auth";

export async function checkAccountAction(email: string): Promise<AccountCheckResponse> {
  return authApi.checkAccount(email);
}
