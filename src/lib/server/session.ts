import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { readSessionConfig } from "./env";
import { getStoredPassword, setStoredPassword, verifyStoredPassword } from "./password-store";

export const SESSION_COOKIE_NAME = "youquiz_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const SECRET_CACHE_TTL_MS = 30_000;
let cachedSecret: { value: string; expiresAt: number } | null = null;

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

async function resolveSigningSecret(): Promise<string> {
  if (cachedSecret && cachedSecret.expiresAt > Date.now()) return cachedSecret.value;
  let value: string;
  try {
    const stored = await getStoredPassword();
    value = stored ? stored.hash : readSessionConfig().SITE_PASSWORD;
  } catch {
    value = readSessionConfig().SITE_PASSWORD;
  }
  cachedSecret = { value, expiresAt: Date.now() + SECRET_CACHE_TTL_MS };
  return value;
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  try {
    const stored = await getStoredPassword().catch(() => null);
    if (stored) return verifyStoredPassword(candidate, stored);
    return safeEqual(candidate, readSessionConfig().SITE_PASSWORD);
  } catch {
    return false;
  }
}

export async function changePassword(newPassword: string): Promise<void> {
  await setStoredPassword(newPassword);
  cachedSecret = null;
}

export async function createSessionToken(): Promise<string> {
  const secret = await resolveSigningSecret();
  const payload = `${Date.now()}.${randomBytes(8).toString("hex")}`;
  return `${payload}.${sign(payload, secret)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = await resolveSigningSecret();
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return false;
    const payload = token.slice(0, lastDot);
    const signature = token.slice(lastDot + 1);
    if (!safeEqual(signature, sign(payload, secret))) return false;
    const issuedAt = Number(payload.split(".")[0]);
    return Number.isFinite(issuedAt) && Date.now() - issuedAt < SESSION_MAX_AGE_SECONDS * 1000;
  } catch {
    return false;
  }
}
