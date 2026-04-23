import { NextResponse } from "next/server";

import { parseGuests } from "@/lib/api-validators";
import { makeToken } from "@/lib/invitation-utils";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const body = (await request.json()) as { guests?: unknown };
    const guests = parseGuests(body.guests);

    if (guests.length === 0) {
      return NextResponse.json(
        { error: "Envía al menos un invitado válido." },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado." },
        { status: 404 },
      );
    }

    await prisma.guest.createMany({
      data: guests.map((guest) => ({
        eventId: event.id,
        name: guest.name,
        contact: guest.contact,
        token: makeToken(),
      })),
    });

    return NextResponse.json({
      message: `${guests.length} invitado(s) agregado(s).`,
    });
  } catch (error) {
    console.error("[POST /api/events/[slug]/guests]", error);
    return NextResponse.json(
      { error: "No se pudieron agregar invitados." },
      { status: 500 },
    );
  }
}
