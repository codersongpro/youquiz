import { z } from "zod";

const publicConfigSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1)
});

export function readPublicFirebaseConfig() {
  return publicConfigSchema.safeParse(process.env).success
    ? publicConfigSchema.parse(process.env)
    : null;
}
