"use client";

import { FormEvent, useEffect, useState } from "react";

type LandingData = {
  title: string;
  slug: string;
  eventDate: string;
  location: string;
  message: string | null;
  coverImageUrl: string | null;
  photos: { id: number; imageUrl: string }[];
  quotes: { id: number; phrase: string }[];
};

type Props = { slug: string };

export function InvitationLandingClient({ slug }: Props) {
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [form, setForm] = useState({
    attendeeName: "",
    attendance: "YES",
    isCeliac: false,
    isVegan: false,
    isVegetarian: false,
    conditionOther: "",
    comment: "",
  });

  useEffect(() => {
    fetch(`/api/public/invitations/${slug}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          invitation?: LandingData;
          error?: string;
        };
        if (!response.ok || !payload.invitation) {
          setError(payload.error ?? "No se pudo cargar la invitacion.");
          return;
        }
        setData(payload.invitation);
      })
      .catch(() => setError("No se pudo cargar la invitacion."))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const response = await fetch(`/api/rsvp/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          conditionOther: form.conditionOther.trim(),
          comment: form.comment.trim(),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setResult(payload.error ?? "No se pudo enviar la respuesta.");
        return;
      }
      setResult("Gracias, recibimos tu respuesta.");
      setForm({
        attendeeName: "",
        attendance: "YES",
        isCeliac: false,
        isVegan: false,
        isVegetarian: false,
        conditionOther: "",
        comment: "",
      });
    } catch {
      setResult("No se pudo enviar la respuesta.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl px-4 py-10">Cargando invitacion...</main>;
  }

  if (error || !data) {
    return <main className="mx-auto max-w-4xl px-4 py-10 text-red-600">{error}</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        {data.coverImageUrl ? (
          <img
            src={data.coverImageUrl}
            alt={data.title}
            className="h-64 w-full object-cover sm:h-80"
          />
        ) : null}
        <div className="p-6">
          <h1 className="text-3xl font-semibold">{data.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {new Date(data.eventDate).toLocaleString("es-AR")} · {data.location}
          </p>
          {data.message ? <p className="mt-4 text-sm">{data.message}</p> : null}
        </div>
      </section>

      {data.photos.length > 0 ? (
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {data.photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.imageUrl}
              alt="Foto del evento"
              className="h-52 w-full rounded-xl object-cover"
            />
          ))}
        </section>
      ) : null}

      {data.quotes.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Frases</h2>
          <ul className="mt-3 grid gap-2">
            {data.quotes.map((quote) => (
              <li key={quote.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                {quote.phrase}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Confirmar asistencia</h2>
        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm">
            <span>Nombre y apellido</span>
            <input
              value={form.attendeeName}
              onChange={(event) =>
                setForm((current) => ({ ...current, attendeeName: event.target.value }))
              }
              required
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>Asistencia</span>
            <select
              value={form.attendance}
              onChange={(event) =>
                setForm((current) => ({ ...current, attendance: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            >
              <option value="YES">Si, asisto</option>
              <option value="NO">No, no puedo asistir</option>
            </select>
          </label>

          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p>Condicion alimentaria</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isCeliac}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isCeliac: event.target.checked }))
                }
              />
              Celiaco
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isVegan}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isVegan: event.target.checked }))
                }
              />
              Vegano
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isVegetarian}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isVegetarian: event.target.checked }))
                }
              />
              Vegetariano
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span>Otra condicion</span>
            <input
              value={form.conditionOther}
              onChange={(event) =>
                setForm((current) => ({ ...current, conditionOther: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>Comentario</span>
            <textarea
              rows={3}
              value={form.comment}
              onChange={(event) =>
                setForm((current) => ({ ...current, comment: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {saving ? "Enviando..." : "Enviar respuesta"}
          </button>
          {result ? <p className="text-sm text-[var(--muted)]">{result}</p> : null}
        </form>
      </section>
    </main>
  );
}
