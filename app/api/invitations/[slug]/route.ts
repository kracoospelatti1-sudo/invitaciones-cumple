import { NextResponse } from "next/server";

import { requireAdminOr401 } from "@/lib/api-auth";
import { makeHostViewToken } from "@/lib/invitation-utils";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: RouteContext) {
  const auth = await requireAdminOr401();
  if (auth) return auth;

  const { slug } = await context.params;
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: {
      client: true,
      photos: { orderBy: { sortOrder: "asc" } },
      quotes: { orderBy: { sortOrder: "asc" } },
      rsvps: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitacion no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ invitation });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminOr401();
  if (auth) return auth;

  const { slug } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.location === "string" && body.location.trim()) {
    data.location = body.location.trim();
  }
  if (typeof body.message === "string") data.message = body.message.trim() || null;
  if (typeof body.coverImageUrl === "string") {
    data.coverImageUrl = body.coverImageUrl.trim() || null;
  }
  if (typeof body.eventDate === "string" && body.eventDate.trim()) {
    const parsed = new Date(body.eventDate);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "eventDate invalido." }, { status: 400 });
    }
    data.eventDate = parsed;
  }
  if (typeof body.status === "string" && ["DRAFT", "PUBLISHED"].includes(body.status)) {
    data.status = body.status;
  }
  if (typeof body.clientName === "string" && body.clientName.trim()) {
    data.client = {
      update: {
        name: body.clientName.trim(),
      },
    };
  }
  if (body.rotateHostToken === true) {
    data.hostViewToken = makeHostViewToken();
  }

  const updated = await prisma.invitation.update({
    where: { slug },
    data,
    include: { client: true },
  });

  return NextResponse.json({ invitation: updated });
}

export async function DELETE(_: Request, context: RouteContext) {
  const auth = await requireAdminOr401();
  if (auth) return auth;

  const { slug } = await context.params;
  await prisma.invitation.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
