"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type GuestStatus = "YES" | "NO" | "PENDING";

type EventDetailsPayload = {
  event: {
    title: string;
    slug: string;
    eventDate: string;
    location: string;
    message: string | null;
  };
  stats: {
    yes: number;
    no: number;
    pending: number;
    totalGuests: number;
    totalCompanions: number;
    confirmedPeople: number;
  };
  guests: {
    id: number;
    name: string;
    contact: string | null;
    token: string;
    status: GuestStatus;
    companions: number;
    comment: string | null;
    respondedAt: string | null;
  }[];
  error?: string;
};

function parseGuestsFromText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split(",");
      return {
        name: name.trim(),
        contact: rest.join(",").trim() || null,
      };
    })
    .filter((guest) => guest.name.length > 0);
}

function statusClass(status: GuestStatus) {
  if (status === "YES") return "bg-emerald-100 text-emerald-700";
  if (status === "NO") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: GuestStatus) {
  if (status === "YES") return "Asiste";
  if (status === "NO") return "No asiste";
  return "Pendiente";
}

export function EventPageClient({ slug }: { slug: string }) {
  const [data, setData] = useState<EventDetailsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestText, setGuestText] = useState("");
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<string | null>(null);

  const newGuestCount = useMemo(
    () => parseGuestsFromText(guestText).length,
    [guestText],
  );

  async function reloadEvent() {
    try {
      const response = await fetch(`/api/events/${slug}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as EventDetailsPayload;

      if (!response.ok) {
        setError(payload.error ?? "No se pudo cargar el evento.");
        setData(null);
      } else {
        setError(null);
        setData(payload);
      }
    } catch {
      setError("No se pudo cargar el evento.");
      setData(null);
    }
  }

  useEffect(() => {
    let isActive = true;

    fetch(`/api/events/${slug}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as EventDetailsPayload;
        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setError(payload.error ?? "No se pudo cargar el evento.");
          setData(null);
        } else {
          setError(null);
          setData(payload);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("No se pudo cargar el evento.");
          setData(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [slug]);

  async function handleAddGuests(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddResult(null);
    setAdding(true);

    try {
      const guests = parseGuestsFromText(guestText);
      const response = await fetch(`/api/events/${slug}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guests }),
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setAddResult(payload.error ?? "No se pudieron agregar invitados.");
      } else {
        setGuestText("");
        setAddResult(payload.message ?? "Invitados agregados.");
        await reloadEvent();
      }
    } catch {
      setAddResult("No se pudieron agregar invitados.");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-sm text-slate-500">Cargando evento...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "Evento no encontrado."}
        </div>
        <Link className="mt-4 inline-block text-sm text-[#cc5c33]" href="/">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-medium text-[#cc5c33] hover:underline">
          ← Volver a crear eventos
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-[#15233b]">
          {data.event.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {new Date(data.event.eventDate).toLocaleString("es-AR")} |{" "}
          {data.event.location}
        </p>
        {data.event.message ? (
          <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {data.event.message}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Sí</p>
          <p className="mt-1 text-2xl font-semibold text-[#15233b]">
            {data.stats.yes}
          </p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">No</p>
          <p className="mt-1 text-2xl font-semibold text-[#15233b]">
            {data.stats.no}
          </p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Pendientes
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#15233b]">
            {data.stats.pending}
          </p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Confirmados totales
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#15233b]">
            {data.stats.confirmedPeople}
          </p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Invitados
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#15233b]">
            {data.stats.totalGuests}
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.7fr]">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-[#15233b]">
            Agregar invitados
          </h2>
          <form className="mt-4 grid gap-3" onSubmit={handleAddGuests}>
            <textarea
              rows={6}
              value={guestText}
              onChange={(event) => setGuestText(event.target.value)}
              placeholder={"Lucía Díaz, +54911...\nMiguel Sánchez, miguel@mail.com"}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#cc5c33]"
            />
            <p className="text-xs text-slate-500">
              Detectados: {newGuestCount} invitado(s)
            </p>
            <button
              type="submit"
              disabled={adding}
              className="rounded-xl bg-[#15233b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#223a60] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {adding ? "Guardando..." : "Agregar invitados"}
            </button>
          </form>
          {addResult ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {addResult}
            </p>
          ) : null}
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-[#15233b]">
            Invitados y respuestas
          </h2>
          {data.guests.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No hay invitados cargados todavía.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {data.guests.map((guest) => (
                <li
                  key={guest.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">{guest.name}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(guest.status)}`}
                    >
                      {statusLabel(guest.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {guest.contact ?? "Sin contacto"}
                  </p>
                  <p className="mt-1 text-xs font-mono text-slate-500">
                    /invitacion/{guest.token}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                    <Link
                      className="font-semibold text-[#cc5c33] hover:underline"
                      href={`/invitacion/${guest.token}`}
                    >
                      Abrir link
                    </Link>
                    <span>Acompañantes: {guest.companions}</span>
                    {guest.respondedAt ? (
                      <span>
                        Respondió:{" "}
                        {new Date(guest.respondedAt).toLocaleString("es-AR")}
                      </span>
                    ) : null}
                  </div>
                  {guest.comment ? (
                    <p className="mt-2 rounded-xl bg-white px-2 py-1 text-xs text-slate-600">
                      Nota: {guest.comment}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
