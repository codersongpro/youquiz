import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { readServerConfig } from "./env";

export function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const config = readServerConfig();
  return initializeApp({
    credential: cert({
      projectId: config.FIREBASE_PROJECT_ID,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
