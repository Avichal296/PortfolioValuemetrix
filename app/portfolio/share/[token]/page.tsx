"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

type Holding = { ticker: string; quantity: number; buyPrice: number };
type Portfolio = {
  id: string;
  title: string;
  cash: number;
  holdings: Holding[];
  user?: { name: string | null };
};
type Insights = {
  summary: string;
  diversification: string;
  sectorExposure: string;
  riskLevel: string;
  thesis: string;
};

export default function SharedPortfolioPage() {
  const params = useParams();
  const token = params?.token as string;
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    const res = await fetch(`/api/portfolios/share/${token}`);
    if (!res.ok) {
      setError("Link invalid or revoked.");
      setPortfolio(null);
      return null;
    }
    const p = (await res.json()) as Portfolio;
    setPortfolio(p);
    setError("");
    return p;
  }, [token]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const p = await fetchPortfolio();
      setLoading(false);
      if (!p) return;
      try {
        await fetch(`/api/portfolios/share/${token}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        /* ignore */
      }
      if (!p.holdings?.length) return;
      const tickers = p.holdings.map((h) => h.ticker);
      const pr = await fetch(
        `/api/stocks/prices?tickers=${encodeURIComponent(tickers.join(","))}`
      ).then((r) => r.json()) as Record<string, number>;
      setPrices(pr);
    })();
  }, [fetchPortfolio, token]);

  async function loadInsights() {
    setInsightsLoading(true);
    try {
      const res = await fetch(`/api/portfolios/share/${token}/insights`, {
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

  async function askChat(e: React.FormEvent) {
    e.preventDefault();
    const q = chatQuestion.trim();
    if (!q || chatLoading) return;
    setChatLoading(true);
    setChatAnswer("");
    try {
      const res = await fetch(`/api/portfolios/share/${token}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { answer: string };
      setChatAnswer(data.answer);
      setChatQuestion("");
    } catch {
      setChatAnswer("Sorry, could not get an answer.");
    } finally {
      setChatLoading(false);
    }
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
      </main>
    );
  }
  if (!portfolio) return null;

  const equity = portfolio.holdings.reduce((sum, h) => {
    const price = prices[h.ticker] ?? h.buyPrice;
    return sum + price * h.quantity;
  }, 0);
  const total = equity + portfolio.cash;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Shared portfolio · View only
      </p>
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

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium">Q&A</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          Ask about this portfolio, e.g. &quot;What&apos;s the largest holding?&quot; or &quot;What&apos;s the risk level?&quot;
        </p>
        <form onSubmit={askChat} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            placeholder="Your question…"
            disabled={chatLoading}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatQuestion.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {chatLoading ? "…" : "Ask"}
          </button>
        </form>
        {chatAnswer && (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {chatAnswer}
          </div>
        )}
      </section>
    </main>
  );
}
