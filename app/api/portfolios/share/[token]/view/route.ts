import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  });
  if (!p) {
    return NextResponse.json(
      { error: "Link invalid or revoked" },
      { status: 404 }
    );
  }

  let body: { fingerprint?: string } = {};
  try {
    body = (await req.json()) as { fingerprint?: string };
  } catch {
    /* no body */
  }
  const fingerprint = typeof body.fingerprint === "string" ? body.fingerprint : null;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip") ?? null;

  await prisma.tokenAccessLog.create({
    data: {
      shareToken: token,
      portfolioId: p.id,
      fingerprint: fingerprint ?? undefined,
      ip: ip ?? undefined,
    },
  });
  return NextResponse.json({ ok: true });
}
