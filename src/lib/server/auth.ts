import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

const FAMILY_UID = "family";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(request: NextRequest): Promise<string> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!(await verifySessionToken(token))) throw new AuthError("Sign in to continue.", 401);
  return FAMILY_UID;
}

export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function authErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthError) return apiError(error.message, error.status);
  return apiError(fallbackMessage, 401);
}
