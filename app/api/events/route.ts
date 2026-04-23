import { NextResponse } from "next/server";

import { parseDate, parseGuests } from "@/lib/api-validators";
import { makeSlug, makeToken } from "@/lib/invitation-utils";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function createUniqueSlug(title: string): Promise<string> {
  const base = makeSlug(title);
  let candidate = base;
  let counter = 2;

  while (true) {
    const exists = await prisma.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }

    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        guests: {
          include: {
            rsvp: true,
          },
        },
      },
    });

    const payload = events.map((event) => {
      const stats = event.guests.reduce(
        (acc, guest) => {
          if (!guest.rsvp) {
            acc.pending += 1;
            return acc;
          }

          if (guest.rsvp.status === "YES") {
            acc.yes += 1;
          } else {
            acc.no += 1;
          }

          return acc;
        },
        { yes: 0, no: 0, pending: 0 },
      );

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        eventDate: event.eventDate,
        location: event.location,
        message: event.message,
        createdAt: event.createdAt,
        stats,
        totalGuests: event.guests.length,
      };
    });

    return NextResponse.json({ events: payload });
  } catch (error) {
    console.error("[GET /api/events]", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los eventos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: unknown;
      eventDate?: unknown;
      location?: unknown;
      message?: unknown;
      guests?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    const message =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message.trim()
        : null;
    const eventDate = parseDate(body.eventDate);
    const guests = parseGuests(body.guests);

    if (!title || !location || !eventDate) {
      return NextResponse.json(
        { error: "Completa título, fecha y lugar." },
        { status: 400 },
      );
    }

    const slug = await createUniqueSlug(title);

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        eventDate,
        location,
        message,
        guests: {
          create: guests.map((guest) => ({
            name: guest.name,
            contact: guest.contact,
            token: makeToken(),
          })),
        },
      },
      include: {
        guests: {
          orderBy: { createdAt: "asc" },
          include: { rsvp: true },
        },
      },
    });

    return NextResponse.json(
      {
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          eventDate: event.eventDate,
          location: event.location,
          message: event.message,
          createdAt: event.createdAt,
        },
        guests: event.guests.map((guest) => ({
          id: guest.id,
          name: guest.name,
          contact: guest.contact,
          token: guest.token,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/events]", error);
    return NextResponse.json(
      { error: "No se pudo crear el evento." },
      { status: 500 },
    );
  }
}
