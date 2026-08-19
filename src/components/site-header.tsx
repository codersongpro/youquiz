"use client";

import Link from "next/link";
import { useAuth } from "./auth-context";

export function SiteHeader() {
  const { configured, ready, signIn, signOutUser, user } = useAuth();
  return <header className="site-header"><Link className="brand" href="/">YouQuiz</Link><nav><Link href="/history">History</Link><Link href="/review">Review</Link><Link href="/stats">Stats</Link></nav><div>{!configured ? <span className="status">Setup needed</span> : !ready ? <span className="status">Loading</span> : user ? <button className="text-button" onClick={() => void signOutUser()}>Sign out</button> : <button className="button" onClick={() => void signIn()}>Sign in with Google</button>}</div></header>;
}
