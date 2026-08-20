import type { NextRequest } from "next/server";

import { readAllowedEmails } from "./env";
import { getAdminAuth } from "./firebase-admin";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(request: NextRequest): Promise<string> {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) throw new AuthError("Sign in to continue.", 401);
  const token = await getAdminAuth().verifyIdToken(value.slice(7));
  const email = token.email?.toLowerCase();
  if (!email || !readAllowedEmails().has(email)) throw new AuthError("This Google account isn't allowed to use YouQuiz.", 403);
  return token.uid;
}

export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function authErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthError) return apiError(error.message, error.status);
  return apiError(fallbackMessage, 401);
}
