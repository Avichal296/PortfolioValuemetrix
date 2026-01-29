"use client";

import { useState } from "react";

export type HoldingRow = { ticker: string; quantity: number; buyPrice: number };

type Props = {
  defaultTitle?: string;
  defaultPrivacy?: string;
  defaultCash?: number;
  defaultHoldings?: HoldingRow[];
  submitLabel?: string;
  onSubmit: (data: {
    title: string;
    privacy: string;
    cash: number;
    holdings: HoldingRow[];
  }) => Promise<void>;
};

const PRIVACIES = [
  { value: "PRIVATE", label: "Private" },
  { value: "PUBLIC", label: "Public" },
  { value: "SMART_SHARED", label: "Smart shared" },
] as const;

export function PortfolioForm({
  defaultTitle = "",
  defaultPrivacy = "PRIVATE",
  defaultCash = 0,
  defaultHoldings = [],
  submitLabel = "Save",
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [privacy, setPrivacy] = useState(defaultPrivacy);
  const [cash, setCash] = useState(String(defaultCash));
  const [holdings, setHoldings] = useState<HoldingRow[]>(
    defaultHoldings.length
      ? defaultHoldings
      : [{ ticker: "", quantity: 0, buyPrice: 0 }]
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addRow() {
    setHoldings((h) => [...h, { ticker: "", quantity: 0, buyPrice: 0 }]);
  }

  function removeRow(i: number) {
    setHoldings((h) => h.filter((_, idx) => idx !== i));
  }

  function updateRow(
    i: number,
    field: keyof HoldingRow,
    value: string | number
  ) {
    setHoldings((h) => {
      const next = [...h];
      if (field === "ticker") next[i] = { ...next[i], ticker: String(value) };
      else if (field === "quantity")
        next[i] = { ...next[i], quantity: Number(value) || 0 };
      else if (field === "buyPrice")
        next[i] = { ...next[i], buyPrice: Number(value) || 0 };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const t = title.trim();
    if (!t) {
      setError("Title required.");
      setLoading(false);
      return;
    }
    const filtered = holdings.filter(
      (h) => h.ticker.trim() && h.quantity > 0 && h.buyPrice >= 0
    );
    if (filtered.length === 0 && Number(cash) <= 0) {
      setError("Add at least one holding or cash.");
      setLoading(false);
      return;
    }
    try {
      await onSubmit({
        title: t,
        privacy,
        cash: Number(cash) || 0,
        holdings: filtered,
      });
    } catch (err) {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Portfolio title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
          placeholder="e.g. My equity portfolio"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Privacy
        </label>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {PRIVACIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Cash (₹)
        </label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={cash}
          onChange={(e) => setCash(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Holdings
          </label>
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            + Add row
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  Ticker
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  Qty
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  Buy price (₹)
                </th>
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={h.ticker}
                      onChange={(e) => updateRow(i, "ticker", e.target.value)}
                      placeholder="INFY"
                      className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={h.quantity || ""}
                      onChange={(e) =>
                        updateRow(i, "quantity", e.target.value)
                      }
                      placeholder="0"
                      className="w-24 rounded border border-zinc-200 bg-white px-2 py-1.5 text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={h.buyPrice || ""}
                      onChange={(e) =>
                        updateRow(i, "buyPrice", e.target.value)
                      }
                      placeholder="0"
                      className="w-28 rounded border border-zinc-200 bg-white px-2 py-1.5 text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="rounded p-1 text-zinc-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:opacity-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
