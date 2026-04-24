import { NextResponse } from "next/server";
import { InvitationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: RouteContext) {
  const { slug } = await context.params;
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      quotes: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invitation || invitation.status !== InvitationStatus.PUBLISHED) {
    return NextResponse.json({ error: "Invitacion no disponible." }, { status: 404 });
  }

  return NextResponse.json({
    invitation: {
      title: invitation.title,
      slug: invitation.slug,
      eventDate: invitation.eventDate,
      location: invitation.location,
      message: invitation.message,
      coverImageUrl: invitation.coverImageUrl,
      photos: invitation.photos,
      quotes: invitation.quotes,
    },
  });
}
