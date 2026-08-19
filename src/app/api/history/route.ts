import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/server/auth";
import { listAttempts } from "@/lib/server/store";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { try { return Response.json({ attempts: await listAttempts(await requireUser(request)) }); } catch { return apiError("Sign in to view history.", 401); } }
