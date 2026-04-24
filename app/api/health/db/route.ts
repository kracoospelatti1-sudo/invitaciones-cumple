import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [clients, invitations, rsvps] = await Promise.all([
      prisma.client.count(),
      prisma.invitation.count(),
      prisma.rsvp.count(),
    ]);
    return NextResponse.json({
      ok: true,
      stage: "schema",
      counts: { clients, invitations, rsvps },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        stage: "connection",
        message,
      },
      { status: 500 },
    );
  }
}
