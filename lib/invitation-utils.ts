import { randomBytes } from "node:crypto";

const stripAccents = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function makeSlug(value: string): string {
  const normalized = stripAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized || "cumple";
}

export function makeToken(): string {
  return randomBytes(12).toString("hex");
}
