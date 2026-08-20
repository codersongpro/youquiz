import { NextRequest } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { listWrongAnswers } from "@/lib/server/store";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { try { return Response.json({ items: await listWrongAnswers(await requireUser(request)) }); } catch (error) { return authErrorResponse(error, "Sign in to review mistakes."); } }
