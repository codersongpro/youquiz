"use client";

import { onIdTokenChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getClientAuth, googleProvider } from "@/lib/firebase-client";

type AuthContextValue = { user: User | null; ready: boolean; configured: boolean; signIn: () => Promise<void>; signOutUser: () => Promise<void>; token: () => Promise<string | null> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = getClientAuth();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!auth);
  useEffect(() => {
    if (!auth) return;
    return onIdTokenChanged(auth, (nextUser) => { setUser(nextUser); setReady(true); });
  }, [auth]);
  const value = useMemo<AuthContextValue>(() => ({
    user, ready, configured: Boolean(auth),
    signIn: async () => { if (!auth) throw new Error("Firebase is not configured."); await signInWithPopup(auth, googleProvider); },
    signOutUser: async () => { if (auth) await signOut(auth); },
    token: async () => user ? user.getIdToken() : null
  }), [auth, ready, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}
