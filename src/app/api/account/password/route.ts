import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AuthError, requireUser } from "@/lib/server/auth";
import { changePassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, verifyPassword } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireUser(request);
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(4).max(200)
    }).parse(await request.json());
    if (!(await verifyPassword(currentPassword))) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    await changePassword(newPassword);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS
    });
    return response;
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to change password." }, { status: 400 });
  }
}
