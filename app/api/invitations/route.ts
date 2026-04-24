import { NextResponse } from "next/server";

import { requireAdminOr401 } from "@/lib/api-auth";
import { parseCreateInvitationBody } from "@/lib/api-validators";
import { makeHostViewToken, toSlug } from "@/lib/invitation-utils";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function createUniqueSlug(title: string) {
  const base = toSlug(title);
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.invitation.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function GET() {
  const auth = await requireAdminOr401();
  if (auth) return auth;

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      _count: { select: { rsvps: true } },
    },
  });

  return NextResponse.json({
    invitations: invitations.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      eventDate: item.eventDate,
      location: item.location,
      hostViewToken: item.hostViewToken,
      clientName: item.client.name,
      totalRsvps: item._count.rsvps,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminOr401();
  if (auth) return auth;

  const parsed = parseCreateInvitationBody(await request.json());
  if (!parsed) {
    return NextResponse.json(
      { error: "Datos invalidos para crear invitacion." },
      { status: 400 },
    );
  }

  const slug = await createUniqueSlug(parsed.title);
  const hostViewToken = makeHostViewToken();

  const invitation = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name: parsed.clientName,
        contact: parsed.clientContact,
        notes: parsed.clientNotes,
      },
    });

    return tx.invitation.create({
      data: {
        clientId: client.id,
        title: parsed.title,
        slug,
        eventDate: parsed.eventDate,
        location: parsed.location,
        message: parsed.message,
        coverImageUrl: parsed.coverImageUrl,
        status: parsed.status,
        hostViewToken,
        photos: {
          create: parsed.photos.map((url, index) => ({
            imageUrl: url,
            sortOrder: index,
          })),
        },
        quotes: {
          create: parsed.quotes.map((phrase, index) => ({
            phrase,
            sortOrder: index,
          })),
        },
      },
      include: {
        client: true,
      },
    });
  });

  return NextResponse.json(
    {
      invitation: {
        id: invitation.id,
        title: invitation.title,
        slug: invitation.slug,
        hostViewToken: invitation.hostViewToken,
        status: invitation.status,
        clientName: invitation.client.name,
      },
    },
    { status: 201 },
  );
}
