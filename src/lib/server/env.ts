import { z } from "zod";

const publicConfigSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1)
});

const serverConfigSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  YOUTUBE_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.7-flash")
});

export function readPublicFirebaseConfig() {
  return publicConfigSchema.safeParse(process.env).success
    ? publicConfigSchema.parse(process.env)
    : null;
}

export function readServerConfig() {
  return serverConfigSchema.parse(process.env);
}
