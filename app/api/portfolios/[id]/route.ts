import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getPortfolio(id: string) {
  return prisma.portfolio.findUnique({
    where: { id },
    include: { holdings: true, user: { select: { id: true, email: true, name: true } } },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const p = await getPortfolio(id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (p.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(p);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const p = await prisma.portfolio.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (p.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as {
      title?: string;
      privacy?: string;
      cash?: number;
      holdings?: { ticker: string; quantity: number; buyPrice: number }[];
    };
    const title = body.title != null ? String(body.title).trim() : undefined;
    const privacy =
      body.privacy != null &&
      ["PRIVATE", "PUBLIC", "SMART_SHARED"].includes(
        String(body.privacy).toUpperCase()
      )
        ? String(body.privacy).toUpperCase()
        : undefined;
    const cash = body.cash != null ? Number(body.cash) : undefined;
    const holdings = Array.isArray(body.holdings)
      ? body.holdings.filter(
          (h) =>
            typeof h.ticker === "string" &&
            typeof h.quantity === "number" &&
            h.quantity > 0 &&
            typeof h.buyPrice === "number" &&
            h.buyPrice >= 0
        )
      : undefined;

    if (holdings !== undefined) {
      await prisma.holding.deleteMany({ where: { portfolioId: id } });
    }

    const updated = await prisma.portfolio.update({
      where: { id },
      data: {
        ...(title != null && { title }),
        ...(privacy != null && { privacy }),
        ...(cash != null && { cash }),
        ...(holdings != null && {
          holdings: {
            create: holdings.map((h) => ({
              ticker: String(h.ticker).trim().toUpperCase(),
              quantity: h.quantity,
              buyPrice: h.buyPrice,
            })),
          },
        }),
      },
      include: { holdings: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update portfolio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const p = await prisma.portfolio.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (p.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.portfolio.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
