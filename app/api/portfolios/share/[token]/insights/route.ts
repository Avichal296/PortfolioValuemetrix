import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStockPrices } from "@/lib/stock-api";
import {
  generatePortfolioInsights,
  type HoldingInput,
} from "@/lib/openai";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const p = await prisma.portfolio.findFirst({
    where: {
      shareToken: token,
      shareTokenRevokedAt: null,
      privacy: "SMART_SHARED",
    },
    include: { holdings: true },
  });
  if (!p) {
    return NextResponse.json(
      { error: "Link invalid or revoked" },
      { status: 404 }
    );
  }

  const tickers = p.holdings.map((h) => h.ticker);
  const prices = await getStockPrices(tickers);
  const holdings: HoldingInput[] = p.holdings.map((h) => ({
    ticker: h.ticker,
    quantity: h.quantity,
    buyPrice: h.buyPrice,
  }));
  let equity = 0;
  for (const h of p.holdings) {
    const price = prices[h.ticker] ?? h.buyPrice;
    equity += price * h.quantity;
  }
  const total = equity + p.cash;

  const insights = await generatePortfolioInsights({
    title: p.title,
    holdings,
    cash: p.cash,
    prices,
    totals: { equity, total },
  });
  return NextResponse.json(insights);
}
