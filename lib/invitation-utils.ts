import { InvitationStatus } from "@prisma/client";

import { makeToken } from "@/lib/security";

export function toSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "invitacion";
}

export function normalizeStatus(value: unknown): InvitationStatus {
  if (typeof value !== "string") {
    return InvitationStatus.DRAFT;
  }
  const status = value.toUpperCase();
  return status === InvitationStatus.PUBLISHED
    ? InvitationStatus.PUBLISHED
    : InvitationStatus.DRAFT;
}

export function makeHostViewToken() {
  return makeToken(32);
}
