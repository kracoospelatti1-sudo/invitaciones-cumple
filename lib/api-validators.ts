import { Attendance, InvitationStatus } from "@prisma/client";

export type CreateInvitationInput = {
  clientName: string;
  clientContact: string | null;
  clientNotes: string | null;
  title: string;
  eventDate: Date;
  location: string;
  message: string | null;
  coverImageUrl: string | null;
  status: InvitationStatus;
  photos: string[];
  quotes: string[];
};

export type RsvpInput = {
  attendeeName: string;
  attendance: Attendance;
  isCeliac: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  conditionOther: string | null;
  comment: string | null;
};

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableText(value: unknown): string | null {
  const text = toText(value);
  return text.length > 0 ? text : null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => toText(entry))
    .filter((entry) => entry.length > 0)
    .slice(0, 30);
}

export function parseCreateInvitationBody(body: unknown): CreateInvitationInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const source = body as Record<string, unknown>;
  const title = toText(source.title);
  const location = toText(source.location);
  const eventDate = parseDate(source.eventDate);
  const clientName = toText(source.clientName);

  if (!title || !location || !eventDate || !clientName) {
    return null;
  }

  return {
    clientName,
    clientContact: toNullableText(source.clientContact),
    clientNotes: toNullableText(source.clientNotes),
    title,
    eventDate,
    location,
    message: toNullableText(source.message),
    coverImageUrl: toNullableText(source.coverImageUrl),
    status:
      toText(source.status).toUpperCase() === "PUBLISHED"
        ? InvitationStatus.PUBLISHED
        : InvitationStatus.DRAFT,
    photos: parseStringArray(source.photos),
    quotes: parseStringArray(source.quotes),
  };
}

export function parseUpdateInvitationBody(body: unknown): Partial<CreateInvitationInput> | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const source = body as Record<string, unknown>;
  const patch: Partial<CreateInvitationInput> = {};

  if ("title" in source) {
    const title = toText(source.title);
    if (!title) return null;
    patch.title = title;
  }
  if ("eventDate" in source) {
    const date = parseDate(source.eventDate);
    if (!date) return null;
    patch.eventDate = date;
  }
  if ("location" in source) {
    const location = toText(source.location);
    if (!location) return null;
    patch.location = location;
  }
  if ("message" in source) {
    patch.message = toNullableText(source.message);
  }
  if ("coverImageUrl" in source) {
    patch.coverImageUrl = toNullableText(source.coverImageUrl);
  }
  if ("status" in source) {
    const status = toText(source.status).toUpperCase();
    if (status !== "DRAFT" && status !== "PUBLISHED") return null;
    patch.status = status as InvitationStatus;
  }
  if ("clientName" in source) {
    const clientName = toText(source.clientName);
    if (!clientName) return null;
    patch.clientName = clientName;
  }
  if ("clientContact" in source) {
    patch.clientContact = toNullableText(source.clientContact);
  }
  if ("clientNotes" in source) {
    patch.clientNotes = toNullableText(source.clientNotes);
  }

  return patch;
}

export function parseRsvpBody(body: unknown): RsvpInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const source = body as Record<string, unknown>;
  const attendeeName = toText(source.attendeeName);
  const attendanceText = toText(source.attendance).toUpperCase();
  if (!attendeeName || (attendanceText !== "YES" && attendanceText !== "NO")) {
    return null;
  }

  return {
    attendeeName,
    attendance: attendanceText as Attendance,
    isCeliac: Boolean(source.isCeliac),
    isVegan: Boolean(source.isVegan),
    isVegetarian: Boolean(source.isVegetarian),
    conditionOther: toNullableText(source.conditionOther),
    comment: toNullableText(source.comment),
  };
}

export function parseTextListBody(body: unknown): string[] | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const source = body as Record<string, unknown>;
  return parseStringArray(source.items);
}
