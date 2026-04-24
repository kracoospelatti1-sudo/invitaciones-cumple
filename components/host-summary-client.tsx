"use client";

import { useEffect, useState } from "react";

type HostPayload = {
  invitation: {
    title: string;
    eventDate: string;
    location: string;
    message: string | null;
  };
  summary: {
    total: number;
    yes: number;
    no: number;
    celiac: number;
    vegan: number;
    vegetarian: number;
  };
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
  error?: string;
};

export function HostSummaryClient({ token }: { token: string }) {
  const [data, setData] = useState<HostPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/host/${token}/summary`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as HostPayload;
        if (!response.ok) {
          setError(payload.error ?? "No se pudo abrir el panel.");
          return;
        }
        setData(payload);
      })
      .catch(() => setError("No se pudo abrir el panel."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-10">Cargando panel del anfitrion...</main>;
  }

  if (error || !data) {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-red-600">{error}</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-[var(--accent)]">Panel anfitrion</p>
        <h1 className="mt-1 text-2xl font-semibold">{data.invitation.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {new Date(data.invitation.eventDate).toLocaleString("es-AR")} · {data.invitation.location}
        </p>
        {data.invitation.message ? <p className="mt-3 text-sm">{data.invitation.message}</p> : null}
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <article className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--muted)]">Total</p>
          <p className="text-xl font-semibold">{data.summary.total}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--muted)]">Asisten</p>
          <p className="text-xl font-semibold">{data.summary.yes}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--muted)]">No asisten</p>
          <p className="text-xl font-semibold">{data.summary.no}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--muted)]">Celiacos</p>
          <p className="text-xl font-semibold">{data.summary.celiac}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--muted)]">Veganos</p>
          <p className="text-xl font-semibold">{data.summary.vegan}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--muted)]">Vegetarianos</p>
          <p className="text-xl font-semibold">{data.summary.vegetarian}</p>
        </article>
      </section>

      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Listado de respuestas</h2>
        {data.rsvps.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Todavia no hay respuestas.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {data.rsvps.map((rsvp) => (
              <li key={rsvp.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{rsvp.attendeeName}</p>
                  <p className="text-xs font-semibold text-[var(--accent)]">
                    {rsvp.attendance === "YES" ? "Asiste" : "No asiste"}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {new Date(rsvp.createdAt).toLocaleString("es-AR")}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Condiciones: {rsvp.isCeliac ? "Celiaco " : ""}
                  {rsvp.isVegan ? "Vegano " : ""}
                  {rsvp.isVegetarian ? "Vegetariano " : ""}
                  {rsvp.conditionOther ? `| Otra: ${rsvp.conditionOther}` : ""}
                </p>
                {rsvp.comment ? <p className="mt-2 text-sm">Comentario: {rsvp.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
