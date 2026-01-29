"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PortfolioForm } from "@/components/portfolio-form";

type Portfolio = {
  id: string;
  title: string;
  privacy: string;
  cash: number;
  holdings: { ticker: string; quantity: number; buyPrice: number }[];
};

export default function EditPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/portfolios/${id}`);
        if (!res.ok) {
          setError("Portfolio not found.");
          return;
        }
        const p = (await res.json()) as Portfolio;
        setPortfolio(p);
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSubmit(data: {
    title: string;
    privacy: string;
    cash: number;
    holdings: { ticker: string; quantity: number; buyPrice: number }[];
  }) {
    const res = await fetch(`/api/portfolios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      throw new Error(j.error ?? "Failed to update");
    }
    router.push(`/portfolio/${id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </main>
    );
  }
  if (error || !portfolio) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error || "Not found"}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/portfolio/${id}`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← {portfolio.title}
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Edit portfolio</h1>
      <PortfolioForm
        defaultTitle={portfolio.title}
        defaultPrivacy={portfolio.privacy}
        defaultCash={portfolio.cash}
        defaultHoldings={portfolio.holdings.map((h) => ({
          ticker: h.ticker,
          quantity: h.quantity,
          buyPrice: h.buyPrice,
        }))}
        submitLabel="Save"
        onSubmit={handleSubmit}
      />
    </main>
  );
}
