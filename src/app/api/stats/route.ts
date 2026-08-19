import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/server/auth";
import { getStats } from "@/lib/server/store";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { try { return Response.json(await getStats(await requireUser(request))); } catch { return apiError("Sign in to view statistics.", 401); } }
