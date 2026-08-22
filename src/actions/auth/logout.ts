import { authApi } from "@/api/auth";

export async function logoutAction(): Promise<{ success: boolean; message: string }> {
  return authApi.logout();
}
