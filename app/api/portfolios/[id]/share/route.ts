import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

  const shareToken = p.shareToken ?? nanoid(21);
  await prisma.portfolio.update({
    where: { id },
    data: {
      shareToken,
      shareTokenRevokedAt: null,
      privacy: "SMART_SHARED",
    },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const url = `${base}/portfolio/share/${shareToken}`;
  return NextResponse.json({ shareToken, url });
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

  await prisma.portfolio.update({
    where: { id },
    data: { shareTokenRevokedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
