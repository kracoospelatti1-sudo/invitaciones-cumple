import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorWithFields = Error & {
  code?: string;
  meta?: unknown;
};

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const err = error as ErrorWithFields;
    return NextResponse.json(
      {
        ok: false,
        stage: "connection",
        message: err.message,
        code: err.code ?? null,
        meta: err.meta ?? null,
      },
      { status: 500 },
    );
  }

  try {
    const eventsCount = await prisma.event.count();
    const guestsCount = await prisma.guest.count();
    const rsvpsCount = await prisma.rsvp.count();

    return NextResponse.json({
      ok: true,
      stage: "schema",
      counts: {
        events: eventsCount,
        guests: guestsCount,
        rsvps: rsvpsCount,
      },
    });
  } catch (error) {
    const err = error as ErrorWithFields;
    return NextResponse.json(
      {
        ok: false,
        stage: "schema",
        message: err.message,
        code: err.code ?? null,
        meta: err.meta ?? null,
      },
      { status: 500 },
    );
  }
}
