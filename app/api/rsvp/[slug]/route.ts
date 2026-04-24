import { NextResponse } from "next/server";
import { InvitationStatus } from "@prisma/client";

import { parseRsvpBody } from "@/lib/api-validators";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const parsed = parseRsvpBody(await request.json());

  if (!parsed) {
    return NextResponse.json({ error: "Respuesta RSVP invalida." }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });
  if (!invitation || invitation.status !== InvitationStatus.PUBLISHED) {
    return NextResponse.json({ error: "Invitacion no disponible." }, { status: 404 });
  }

  const rsvp = await prisma.rsvp.create({
    data: {
      invitationId: invitation.id,
      attendeeName: parsed.attendeeName,
      attendance: parsed.attendance,
      isCeliac: parsed.isCeliac,
      isVegan: parsed.isVegan,
      isVegetarian: parsed.isVegetarian,
      conditionOther: parsed.conditionOther,
      comment: parsed.comment,
    },
  });

  return NextResponse.json({ ok: true, rsvpId: rsvp.id }, { status: 201 });
}
