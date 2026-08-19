import type { NextRequest } from "next/server";

import { getAdminAuth } from "./firebase-admin";

export async function requireUser(request: NextRequest): Promise<string> {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) throw new Error("UNAUTHENTICATED");
  const token = await getAdminAuth().verifyIdToken(value.slice(7));
  return token.uid;
}

export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
