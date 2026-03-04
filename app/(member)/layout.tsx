import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";

export default async function MemberLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-slate-950">
              HH
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Halal Harmony
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            <Link
              href="/dashboard"
              className="text-slate-200 hover:text-accent-200"
            >
              Home
            </Link>
            <Link
              href="/search"
              className="text-slate-200 hover:text-accent-200"
            >
              Search
            </Link>
            <Link
              href="/messages"
              className="text-slate-200 hover:text-accent-200"
            >
              Messages
            </Link>
            <Link
              href="/profile"
              className="text-slate-200 hover:text-accent-200"
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

