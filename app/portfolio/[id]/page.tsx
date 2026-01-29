"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

type Holding = { ticker: string; quantity: number; buyPrice: number };
type Portfolio = {
  id: string;
  title: string;
  privacy: string;
  cash: number;
  shareToken: string | null;
  shareTokenRevokedAt: string | null;
  holdings: Holding[];
};
type Insights = {
  summary: string;
  diversification: string;
  sectorExposure: string;
  riskLevel: string;
  thesis: string;
};

export default function PortfolioViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [insights, setInsights] = useState<Insights | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    const res = await fetch(`/api/portfolios/${id}`);
    if (!res.ok) {
      setError("Portfolio not found.");
      setPortfolio(null);
      return;
    }
    const p = (await res.json()) as Portfolio;
    setPortfolio(p);
    setError("");
    return p;
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const p = await fetchPortfolio();
      setLoading(false);
      if (!p?.holdings?.length) return;
      const tickers = p.holdings.map((h) => h.ticker);
      const pr = await fetch(
        `/api/stocks/prices?tickers=${encodeURIComponent(tickers.join(","))}`
      ).then((r) => r.json()) as Record<string, number>;
      setPrices(pr);
    })();
  }, [fetchPortfolio]);

  useEffect(() => {
    if (typeof window === "undefined" || !portfolio) return;
    if (window.location.hash !== "#share") return;
    if (
      portfolio.privacy === "SMART_SHARED" &&
      portfolio.shareToken &&
      !portfolio.shareTokenRevokedAt
    ) {
      setShareUrl(`${window.location.origin}/portfolio/share/${portfolio.shareToken}`);
    }
  }, [portfolio]);

  async function loadInsights() {
    if (!portfolio) return;
    setInsightsLoading(true);
    try {
      const res = await fetch(`/api/portfolios/${id}/insights`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as Insights;
      setInsights(data);
    } catch {
      setError("Could not load insights.");
    } finally {
      setInsightsLoading(false);
    }
  }

  async function enableShare() {
    if (!portfolio) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/portfolios/${id}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { url: string };
      setShareUrl(data.url);
      await fetchPortfolio();
    } catch {
      setError("Could not create share link.");
    } finally {
      setShareLoading(false);
    }
  }

  async function revokeShare() {
    if (!portfolio) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/portfolios/${id}/share`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setShareUrl(null);
      await fetchPortfolio();
    } catch {
      setError("Could not revoke share.");
    } finally {
      setShareLoading(false);
    }
  }

  function copyShareLink() {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </main>
    );
  }
  if (error && !portfolio) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
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
  if (!portfolio) return null;

  const tickers = portfolio.holdings.map((h) => h.ticker);
  const equity = portfolio.holdings.reduce((sum, h) => {
    const price = prices[h.ticker] ?? h.buyPrice;
    return sum + price * h.quantity;
  }, 0);
  const total = equity + portfolio.cash;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Dashboard
          </Link>
          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
            {portfolio.privacy.replace("_", " ")}
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/portfolio/${id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
          {portfolio.privacy === "SMART_SHARED" &&
          portfolio.shareToken &&
          !portfolio.shareTokenRevokedAt ? (
            <button
              type="button"
              onClick={() => {
                const base =
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "";
                const u = `${base}/portfolio/share/${portfolio.shareToken}`;
                setShareUrl(u);
              }}
              className="rounded-md border border-emerald-500 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            >
              Share link
            </button>
          ) : (
            <button
              type="button"
              onClick={enableShare}
              disabled={shareLoading}
              className="rounded-md border border-emerald-500 px-3 py-1.5 text-sm font-medium text-emerald-700 disabled:opacity-50 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            >
              {shareLoading ? "Creating…" : "Enable share"}
            </button>
          )}
        </div>
      </div>

      {shareUrl && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 rounded border border-emerald-200 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-emerald-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={copyShareLink}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={revokeShare}
            disabled={shareLoading}
            className="rounded border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Revoke
          </button>
        </div>
      )}

      <h1 className="mb-6 text-2xl font-semibold">{portfolio.title}</h1>

      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium">Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                <th className="pb-2 pr-4">Ticker</th>
                <th className="pb-2 pr-4">Qty</th>
                <th className="pb-2 pr-4">Price</th>
                <th className="pb-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((h) => {
                const price = prices[h.ticker] ?? h.buyPrice;
                const value = price * h.quantity;
                return (
                  <tr
                    key={h.ticker}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="py-2 pr-4 font-medium">{h.ticker}</td>
                    <td className="py-2 pr-4">{h.quantity}</td>
                    <td className="py-2 pr-4">{formatCurrency(price)}</td>
                    <td className="py-2">{formatCurrency(value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <span className="text-zinc-600 dark:text-zinc-400">
            Equity: {formatCurrency(equity)}
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">
            Cash: {formatCurrency(portfolio.cash)}
          </span>
          <span className="font-medium">
            Total: {formatCurrency(total)}
          </span>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium">AI insights</h2>
        {!insights ? (
          <button
            type="button"
            onClick={loadInsights}
            disabled={insightsLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {insightsLoading ? "Generating…" : "Generate insights"}
          </button>
        ) : (
          <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            <p><strong>Summary:</strong> {insights.summary}</p>
            <p><strong>Diversification:</strong> {insights.diversification}</p>
            <p><strong>Sector exposure:</strong> {insights.sectorExposure}</p>
            <p><strong>Risk:</strong> {insights.riskLevel}</p>
            <p><strong>Thesis:</strong> {insights.thesis}</p>
            <button
              type="button"
              onClick={loadInsights}
              disabled={insightsLoading}
              className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              {insightsLoading ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
