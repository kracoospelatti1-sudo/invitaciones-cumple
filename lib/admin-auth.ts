import { createHash } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "inv_admin_session";

function normalizeSecret(value: string | undefined): string {
  if (!value) {
    return "change-this-admin-secret";
  }
  return value;
}

export function isAdminPasswordConfigured(): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return typeof password === "string" && password.trim().length > 0;
}

function expectedSessionValue(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = normalizeSecret(process.env.ADMIN_SESSION_SECRET);
  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

export function isValidAdminPassword(password: string): boolean {
  if (!isAdminPasswordConfigured()) {
    return false;
  }
  return password === process.env.ADMIN_PASSWORD;
}

export function getAdminSessionValue(): string {
  return expectedSessionValue();
}

export function isValidAdminSessionToken(
  token: string | null | undefined,
): boolean {
  if (!token || !isAdminPasswordConfigured()) {
    return false;
  }
  return token === expectedSessionValue();
}

function getCookieFromHeader(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";").map((item) => item.trim());
  for (const part of parts) {
    if (!part) {
      continue;
    }
    const [key, ...valueParts] = part.split("=");
    if (key !== name) {
      continue;
    }
    const rawValue = valueParts.join("=");
    return decodeURIComponent(rawValue);
  }
  return null;
}

export function isAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = getCookieFromHeader(cookieHeader, ADMIN_SESSION_COOKIE);
  return isValidAdminSessionToken(token);
}
