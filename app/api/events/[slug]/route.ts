import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        guests: {
          orderBy: { createdAt: "asc" },
          include: {
            rsvp: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado." },
        { status: 404 },
      );
    }

    const stats = event.guests.reduce(
      (acc, guest) => {
        if (!guest.rsvp) {
          acc.pending += 1;
          return acc;
        }

        if (guest.rsvp.status === "YES") {
          acc.yes += 1;
          acc.totalCompanions += guest.rsvp.companions;
        } else {
          acc.no += 1;
        }

        return acc;
      },
      { yes: 0, no: 0, pending: 0, totalCompanions: 0 },
    );

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        eventDate: event.eventDate,
        location: event.location,
        message: event.message,
        createdAt: event.createdAt,
      },
      stats: {
        ...stats,
        confirmedPeople: stats.yes + stats.totalCompanions,
        totalGuests: event.guests.length,
      },
      guests: event.guests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        contact: guest.contact,
        token: guest.token,
        status: guest.rsvp?.status ?? "PENDING",
        companions: guest.rsvp?.companions ?? 0,
        comment: guest.rsvp?.comment ?? null,
        respondedAt: guest.rsvp?.respondedAt ?? null,
      })),
    });
  } catch (error) {
    console.error("[GET /api/events/[slug]]", error);
    return NextResponse.json(
      { error: "No se pudo cargar este evento." },
      { status: 500 },
    );
  }
}
