import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/components/auth-context";
import { SiteHeader } from "@/components/site-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { title: "YouQuiz", description: "Turn YouTube videos into age-appropriate quizzes." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={inter.className}><AuthProvider><SiteHeader /><main>{children}</main></AuthProvider></body></html>;
}
