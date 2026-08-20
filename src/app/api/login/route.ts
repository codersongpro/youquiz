import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, verifyPassword } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { password } = z.object({ password: z.string().min(1) }).parse(await request.json());
    if (!(await verifyPassword(password))) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Enter the family password." }, { status: 400 });
  }
}
