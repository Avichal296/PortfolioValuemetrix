import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStockPrices } from "@/lib/stock-api";
import { chatWithPortfolio } from "@/lib/openai";

export async function POST(
  req: Request,
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

  let body: { question?: string } = {};
  try {
    body = (await req.json()) as { question?: string };
  } catch {
    /* no body */
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json(
      { error: "question required" },
      { status: 400 }
    );
  }

  const tickers = p.holdings.map((h) => h.ticker);
  const prices = await getStockPrices(tickers);
  const lines: string[] = [
    `Portfolio: ${p.title}`,
    `Cash: ₹${p.cash.toLocaleString("en-IN")}`,
    "Holdings:",
  ];
  let equity = 0;
  for (const h of p.holdings) {
    const price = prices[h.ticker] ?? h.buyPrice;
    const value = price * h.quantity;
    equity += value;
    lines.push(`  - ${h.ticker}: ${h.quantity} @ ₹${price} = ₹${value.toLocaleString("en-IN")}`);
  }
  lines.push(`Equity total: ₹${equity.toLocaleString("en-IN")}`);
  lines.push(`Total (equity + cash): ₹${(equity + p.cash).toLocaleString("en-IN")}`);
  const context = lines.join("\n");

  const answer = await chatWithPortfolio(context, question);
  return NextResponse.json({ answer });
}
