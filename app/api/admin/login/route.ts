import { NextResponse } from "next/server";

import {
  createAdminSession,
  isAdminEnvConfigured,
  validateAdminPassword,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";

  if (!isAdminEnvConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD no esta configurado." },
      { status: 500 },
    );
  }

  if (!validateAdminPassword(password)) {
    return NextResponse.json({ error: "Credenciales invalidas." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
