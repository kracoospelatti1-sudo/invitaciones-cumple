import { NextResponse } from "next/server";

import { hasAdminSession, isAdminEnvConfigured } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await hasAdminSession();
  return NextResponse.json({
    configured: isAdminEnvConfigured(),
    authenticated,
  });
}
