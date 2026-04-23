import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const guest = await prisma.guest.findUnique({
      where: { token },
      include: {
        event: true,
        rsvp: true,
      },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Invitación no encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
        contact: guest.contact,
        token: guest.token,
      },
      event: {
        title: guest.event.title,
        eventDate: guest.event.eventDate,
        location: guest.event.location,
        message: guest.event.message,
      },
      rsvp: guest.rsvp
        ? {
            status: guest.rsvp.status,
            companions: guest.rsvp.companions,
            comment: guest.rsvp.comment,
            respondedAt: guest.rsvp.respondedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("[GET /api/invitaciones/[token]]", error);
    return NextResponse.json(
      { error: "No se pudo cargar la invitación." },
      { status: 500 },
    );
  }
}
