/**
 * Stock price fetcher: mock prices by default, Finnhub when API key set.
 */

const MOCK_PRICES: Record<string, number> = {
  INFY: 1850,
  TCS: 3850,
  RELIANCE: 985,
  HDFCBANK: 1680,
  ICICIBANK: 1080,
  SBIN: 625,
  BHARTIARTL: 1420,
  ITC: 455,
  KOTAKBANK: 1720,
  LT: 3650,
  AXISBANK: 1180,
  ASHOKLEY: 185,
  TATASTEEL: 145,
  HINDUNILVR: 2450,
  WIPRO: 455,
  MARUTI: 12500,
  BAJFINANCE: 6850,
  HCLTECH: 1680,
  SUNPHARMA: 1480,
  ULTRACEMCO: 9850,
};

function mockPrice(ticker: string): number {
  const upper = ticker.toUpperCase().replace(/\.NS|\.BO|\.NSE|\.BSE/g, "");
  if (MOCK_PRICES[upper]) return MOCK_PRICES[upper];
  const hash = upper.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.round(100 + (hash % 4000));
}

export async function getStockPrices(
  tickers: string[]
): Promise<Record<string, number>> {
  const key = process.env.FINNHUB_API_KEY?.trim();
  const unique = [...new Set(tickers.map((t) => t.toUpperCase().trim()))];

  if (key) {
    try {
      const out: Record<string, number> = {};
      await Promise.all(
        unique.map(async (t) => {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${t}&token=${key}`
          );
          const j = (await res.json()) as { c?: number };
          out[t] = typeof j.c === "number" && j.c > 0 ? j.c : mockPrice(t);
        })
      );
      return out;
    } catch {
      /* fallback to mock */
    }
  }

  const out: Record<string, number> = {};
  for (const t of unique) out[t] = mockPrice(t);
  return out;
}
