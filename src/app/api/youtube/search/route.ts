import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, AuthError, requireUser } from "@/lib/server/auth";
import { searchVideos } from "@/lib/server/youtube-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const query = z.string().trim().min(2).max(100).parse(request.nextUrl.searchParams.get("query"));
    return Response.json({ videos: await searchVideos(query) });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError(error instanceof z.ZodError ? "Enter 2 to 100 characters." : "Unable to search videos.", error instanceof z.ZodError ? 400 : 401);
  }
}
