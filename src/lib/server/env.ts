import { z } from "zod";

const serverConfigSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  YOUTUBE_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.7-flash")
});

export function readServerConfig() {
  return serverConfigSchema.parse(process.env);
}
