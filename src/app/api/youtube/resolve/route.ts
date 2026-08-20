import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, AuthError, requireUser } from "@/lib/server/auth";
import { resolveVideoUrl } from "@/lib/server/youtube-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireUser(request);
    const { url } = z.object({ url: z.string().url().max(500) }).parse(await request.json());
    const video = await resolveVideoUrl(url);
    return video ? Response.json({ video }) : apiError("Use a public, non-live YouTube video of 60 minutes or less.", 400);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError(error instanceof z.ZodError ? "Enter a valid YouTube URL." : "Unable to resolve this video.", error instanceof z.ZodError ? 400 : 401);
  }
}
