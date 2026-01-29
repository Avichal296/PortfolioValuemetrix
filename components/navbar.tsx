"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Navbar({ className }: { className?: string }) {
  const { data: session, status } = useSession();

  return (
    <nav
      className={cn(
        "flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950",
        className
      )}
    >
      <Link
        href="/"
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
      >
        ValueMetrix
      </Link>
      <div className="flex items-center gap-3">
        {status === "loading" ? (
          <span className="text-sm text-zinc-500">...</span>
        ) : session ? (
          <>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
            <span className="text-sm text-zinc-500">
              {session.user?.email ?? session.user?.name ?? "User"}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
