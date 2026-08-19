import { NextRequest } from "next/server";
import { apiError, requireUser } from "@/lib/server/auth";
import { listWrongAnswers } from "@/lib/server/store";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { try { return Response.json({ items: await listWrongAnswers(await requireUser(request)) }); } catch { return apiError("Sign in to review mistakes.", 401); } }
