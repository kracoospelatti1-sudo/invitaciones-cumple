import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionValue,
  isAdminPasswordConfigured,
  isValidAdminPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: unknown };
  const password =
    typeof body.password === "string" ? body.password.trim() : "";

  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      {
        error:
          "Falta configurar ADMIN_PASSWORD en .env para habilitar el acceso admin.",
      },
      { status: 500 },
    );
  }

  if (!isValidAdminPassword(password)) {
    return NextResponse.json(
      { error: "Clave invalida. Intenta de nuevo." },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, getAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return NextResponse.json({ message: "Sesion iniciada." });
}
