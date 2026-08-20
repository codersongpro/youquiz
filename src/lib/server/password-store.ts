import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

import { getAdminDb } from "./firebase-admin";

type StoredPassword = { hash: string; salt: string };

const passwordDoc = () => getAdminDb().collection("settings").doc("auth");

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export async function getStoredPassword(): Promise<StoredPassword | null> {
  const snapshot = await passwordDoc().get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as Partial<StoredPassword> | undefined;
  return data?.hash && data?.salt ? { hash: data.hash, salt: data.salt } : null;
}

export async function setStoredPassword(password: string): Promise<void> {
  const salt = randomBytes(16).toString("hex");
  await passwordDoc().set({ hash: hashPassword(password, salt), salt, updatedAt: new Date().toISOString() });
}

export function verifyStoredPassword(candidate: string, stored: StoredPassword): boolean {
  const candidateHash = Buffer.from(hashPassword(candidate, stored.salt), "hex");
  const storedHash = Buffer.from(stored.hash, "hex");
  return candidateHash.length === storedHash.length && timingSafeEqual(candidateHash, storedHash);
}
