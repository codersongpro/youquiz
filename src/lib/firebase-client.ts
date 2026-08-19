"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

import { readPublicFirebaseConfig } from "./server/env";

export function getClientAuth() {
  const config = readPublicFirebaseConfig();
  if (!config) return null;
  const app = getApps().length > 0 ? getApp() : initializeApp({
    apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: config.NEXT_PUBLIC_FIREBASE_APP_ID
  });
  return getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
