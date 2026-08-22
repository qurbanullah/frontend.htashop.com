import { authApi, type MessageResponse } from "@/api/auth";

export async function verifyEmailAction(token: string, email: string): Promise<MessageResponse> {
  return authApi.verifyEmail(token, email);
}
