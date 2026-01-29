import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.portfolio.findMany({
    where: { userId: session.user.id },
    include: { holdings: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      title?: string;
      privacy?: string;
      cash?: number;
      holdings?: { ticker: string; quantity: number; buyPrice: number }[];
    };
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json(
        { error: "Title required" },
        { status: 400 }
      );
    }
    const privacy = ["PRIVATE", "PUBLIC", "SMART_SHARED"].includes(
      String(body.privacy ?? "").toUpperCase()
    )
      ? String(body.privacy).toUpperCase()
      : "PRIVATE";
    const cash = Number(body.cash) || 0;
    const holdings = Array.isArray(body.holdings)
      ? body.holdings.filter(
          (h) =>
            typeof h.ticker === "string" &&
            typeof h.quantity === "number" &&
            h.quantity > 0 &&
            typeof h.buyPrice === "number" &&
            h.buyPrice >= 0
        )
      : [];

    const portfolio = await prisma.portfolio.create({
      data: {
        title,
        userId: session.user.id,
        privacy,
        cash,
        holdings: {
          create: holdings.map((h) => ({
            ticker: String(h.ticker).trim().toUpperCase(),
            quantity: h.quantity,
            buyPrice: h.buyPrice,
          })),
        },
      },
      include: { holdings: true },
    });
    return NextResponse.json(portfolio);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create portfolio" },
      { status: 500 }
    );
  }
}
