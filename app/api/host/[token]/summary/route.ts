import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: RouteContext) {
  const { token } = await context.params;

  const invitation = await prisma.invitation.findUnique({
    where: { hostViewToken: token },
    include: {
      rsvps: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Panel no encontrado." }, { status: 404 });
  }

  const summary = invitation.rsvps.reduce(
    (acc, item) => {
      if (item.attendance === "YES") {
        acc.yes += 1;
      } else {
        acc.no += 1;
      }
      if (item.isCeliac) acc.celiac += 1;
      if (item.isVegan) acc.vegan += 1;
      if (item.isVegetarian) acc.vegetarian += 1;
      return acc;
    },
    { yes: 0, no: 0, celiac: 0, vegan: 0, vegetarian: 0 },
  );

  return NextResponse.json({
    invitation: {
      title: invitation.title,
      eventDate: invitation.eventDate,
      location: invitation.location,
      message: invitation.message,
    },
    summary: {
      total: invitation.rsvps.length,
      ...summary,
    },
    rsvps: invitation.rsvps,
  });
}
