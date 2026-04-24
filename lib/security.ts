import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "inv_admin_session";

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "dev-only-secret-change-me";
}

export function makeToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

function signSessionValue(password: string): string {
  return createHash("sha256")
    .update(`${password}:${getSessionSecret()}`)
    .digest("hex");
}

export function isAdminEnvConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export async function createAdminSession() {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, signSessionValue(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const current = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!current) {
    return false;
  }

  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    return false;
  }

  return current === signSessionValue(password);
}

export function validateAdminPassword(value: string) {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(password) && value === password;
}
