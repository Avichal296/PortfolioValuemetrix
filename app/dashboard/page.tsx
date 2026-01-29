"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Portfolio = {
  id: string;
  title: string;
  privacy: string;
  shareToken: string | null;
  cash: number;
  holdings: { ticker: string; quantity: number; buyPrice: number }[];
};

export default function DashboardPage() {
  const [list, setList] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/portfolios");
        if (!res.ok) {
          setError("Failed to load portfolios.");
          return;
        }
        const data = (await res.json()) as Portfolio[];
        setList(data);
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My portfolios</h1>
        <Link
          href="/portfolio/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create portfolio
        </Link>
      </div>

      {loading && (
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      )}
      {error && (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {!loading && !error && list.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            No portfolios yet. Create one to get started.
          </p>
          <Link
            href="/portfolio/new"
            className="inline-block rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Create portfolio
          </Link>
        </div>
      )}
      {!loading && !error && list.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {p.title}
                </h2>
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  {p.privacy.replace("_", " ")}
                </span>
              </div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                {p.holdings.length} holding(s) · Cash ₹{p.cash.toLocaleString("en-IN")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/portfolio/${p.id}`}
                  className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  View
                </Link>
                <Link
                  href={`/portfolio/${p.id}/edit`}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Edit
                </Link>
                {p.privacy === "SMART_SHARED" && p.shareToken && (
                  <Link
                    href={`/portfolio/${p.id}#share`}
                    className="rounded-md border border-emerald-500 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                  >
                    Share
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
