import { NextResponse } from "next/server";
import { getStockPrices } from "@/lib/stock-api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("tickers");
  const tickers = raw
    ? raw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  if (tickers.length === 0) {
    return NextResponse.json({ error: "tickers required" }, { status: 400 });
  }
  const prices = await getStockPrices(tickers);
  return NextResponse.json(prices);
}
