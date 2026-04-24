import { NextResponse } from "next/server";

import { requireAdminOr401 } from "@/lib/api-auth";
import { parseTextListBody } from "@/lib/api-validators";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminOr401();
  if (auth) return auth;

  const { slug } = await context.params;
  const items = parseTextListBody(await request.json());
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Envia una lista de fotos valida." }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!invitation) {
    return NextResponse.json({ error: "Invitacion no encontrada." }, { status: 404 });
  }

  const last = await prisma.invitationPhoto.findFirst({
    where: { invitationId: invitation.id },
    orderBy: { sortOrder: "desc" },
  });
  const startOrder = last ? last.sortOrder + 1 : 0;

  await prisma.invitationPhoto.createMany({
    data: items.map((imageUrl, index) => ({
      invitationId: invitation.id,
      imageUrl,
      sortOrder: startOrder + index,
    })),
  });

  return NextResponse.json({ ok: true, added: items.length });
}
