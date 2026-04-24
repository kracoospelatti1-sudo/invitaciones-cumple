"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Details = {
  id: number;
  slug: string;
  title: string;
  eventDate: string;
  location: string;
  message: string | null;
  coverImageUrl: string | null;
  status: "DRAFT" | "PUBLISHED";
  hostViewToken: string;
  client: { name: string; contact: string | null; notes: string | null };
  photos: { id: number; imageUrl: string }[];
  quotes: { id: number; phrase: string }[];
  rsvps: {
    id: number;
    attendeeName: string;
    attendance: "YES" | "NO";
    isCeliac: boolean;
    isVegan: boolean;
    isVegetarian: boolean;
    conditionOther: string | null;
    comment: string | null;
    createdAt: string;
  }[];
};

export function AdminInvitationEditorClient({ slug }: { slug: string }) {
  const [data, setData] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch(`/api/invitations/${slug}`, { cache: "no-store" });
    const payload = (await response.json()) as { invitation?: Details; error?: string };
    if (!response.ok || !payload.invitation) {
      throw new Error(payload.error ?? "No se pudo cargar la invitacion.");
    }
    setData(payload.invitation);
    setStatus(payload.invitation.status);
  }

  useEffect(() => {
    load()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleStatus(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/invitations/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "No se pudo actualizar estado.");
      return;
    }
    setMessage("Estado actualizado.");
    await load();
  }

  async function rotateHostToken() {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/invitations/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rotateHostToken: true }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "No se pudo regenerar token.");
      return;
    }
    setMessage("Link del anfitrion regenerado.");
    await load();
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-4 py-10">Cargando editor...</main>;
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-red-600">{error ?? "No se encontro la invitacion."}</p>
      </main>
    );
  }

  const hostLink = `/panel-host/${data.hostViewToken}`;
  const publicLink = `/i/${data.slug}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-[var(--accent)] underline">
          Volver al panel
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">{data.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Cliente: {data.client.name} · {new Date(data.eventDate).toLocaleString("es-AR")}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">{data.location}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href={publicLink} className="font-semibold text-[var(--accent)] underline">
            Abrir landing publica
          </Link>
          <Link href={hostLink} className="font-semibold text-[var(--accent)] underline">
            Abrir panel host
          </Link>
        </div>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={handleStatus}>
          <label className="grid gap-1 text-sm">
            <span>Estado</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "DRAFT" | "PUBLISHED")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none"
            >
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          >
            Guardar estado
          </button>
          <button
            type="button"
            onClick={rotateHostToken}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            Regenerar link host
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Frases</h2>
          {data.quotes.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">Sin frases cargadas.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {data.quotes.map((quote) => (
                <li key={quote.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  {quote.phrase}
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Fotos</h2>
          {data.photos.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">Sin fotos cargadas.</p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {data.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.imageUrl}
                  alt="Foto evento"
                  className="h-28 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Respuestas RSVP</h2>
        {data.rsvps.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No hay respuestas.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {data.rsvps.map((item) => (
              <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="font-semibold">{item.attendeeName}</p>
                <p className="text-xs text-[var(--muted)]">
                  {item.attendance === "YES" ? "Asiste" : "No asiste"} ·{" "}
                  {new Date(item.createdAt).toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {item.isCeliac ? "Celiaco " : ""}
                  {item.isVegan ? "Vegano " : ""}
                  {item.isVegetarian ? "Vegetariano " : ""}
                  {item.conditionOther ? `| Otra: ${item.conditionOther}` : ""}
                </p>
                {item.comment ? <p className="mt-1 text-xs">Comentario: {item.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
