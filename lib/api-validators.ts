export type GuestInput = {
  name: string;
  contact: string | null;
};

export function parseGuests(value: unknown): GuestInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const maybeName = (entry as { name?: unknown }).name;
      const maybeContact = (entry as { contact?: unknown }).contact;

      if (typeof maybeName !== "string" || maybeName.trim().length === 0) {
        return null;
      }

      return {
        name: maybeName.trim(),
        contact:
          typeof maybeContact === "string" && maybeContact.trim().length > 0
            ? maybeContact.trim()
            : null,
      } satisfies GuestInput;
    })
    .filter((entry): entry is GuestInput => entry !== null);
}

export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function parseRsvpStatus(value: unknown): "YES" | "NO" | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === "YES" || normalized === "NO") {
    return normalized;
  }

  return null;
}

export function parseCompanions(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(10, Math.floor(parsed));
}
