import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
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
    include: { holdings: true, user: { select: { name: true } } },
  });
  if (!p) {
    return NextResponse.json(
      { error: "Link invalid or revoked" },
      { status: 404 }
    );
  }
  return NextResponse.json(p);
}
