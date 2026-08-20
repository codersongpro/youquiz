import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">YouQuiz</Link>
      <nav>
        <Link href="/history">History</Link>
        <Link href="/review">Review</Link>
        <Link href="/stats">Stats</Link>
        <Link href="/account">Account</Link>
      </nav>
      <a className="text-button" href="/api/logout">Sign out</a>
    </header>
  );
}
