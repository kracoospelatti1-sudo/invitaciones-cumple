import { NextResponse } from "next/server";

import { parseCompanions, parseRsvpStatus } from "@/lib/api-validators";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: unknown;
      status?: unknown;
      companions?: unknown;
      comment?: unknown;
    };

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const status = parseRsvpStatus(body.status);
    const companions = parseCompanions(body.companions);
    const comment =
      typeof body.comment === "string" && body.comment.trim().length > 0
        ? body.comment.trim()
        : null;

    if (!token || !status) {
      return NextResponse.json(
        { error: "Faltan datos de confirmación." },
        { status: 400 },
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { token },
      include: { rsvp: true },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Invitación no encontrada." },
        { status: 404 },
      );
    }

    const finalCompanions = status === "YES" ? companions : 0;

    if (guest.rsvp) {
      await prisma.rsvp.update({
        where: { guestId: guest.id },
        data: {
          status,
          companions: finalCompanions,
          comment,
          respondedAt: new Date(),
        },
      });
    } else {
      await prisma.rsvp.create({
        data: {
          guestId: guest.id,
          status,
          companions: finalCompanions,
          comment,
        },
      });
    }

    return NextResponse.json({
      message: "Respuesta registrada con éxito.",
    });
  } catch (error) {
    console.error("[POST /api/rsvp]", error);
    return NextResponse.json(
      { error: "No se pudo guardar la respuesta." },
      { status: 500 },
    );
  }
}
