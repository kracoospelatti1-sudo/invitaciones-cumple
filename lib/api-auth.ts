import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/security";

export async function requireAdminOr401() {
  const ok = await hasAdminSession();
  if (ok) {
    return null;
  }
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}
