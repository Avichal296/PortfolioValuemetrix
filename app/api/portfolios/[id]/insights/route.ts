import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStockPrices } from "@/lib/stock-api";
import {
  generatePortfolioInsights,
  type HoldingInput,
} from "@/lib/openai";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const p = await prisma.portfolio.findUnique({
    where: { id },
    include: { holdings: true },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (p.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
