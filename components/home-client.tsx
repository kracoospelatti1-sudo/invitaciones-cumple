"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type EventSummary = {
  id: number;
  title: string;
  slug: string;
  eventDate: string;
  location: string;
  totalGuests: number;
  stats: {
    yes: number;
    no: number;
    pending: number;
  };
};

type CreatedGuest = {
  id: number;
  name: string;
  contact: string | null;
  token: string;
};

type CreateResponse = {
  event: {
    slug: string;
  };
  guests: CreatedGuest[];
};

const initialForm = {
  title: "",
  eventDate: "",
  location: "",
  message: "",
  guestsText: "",
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

export function HomeClient() {
  const [form, setForm] = useState(initialForm);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newLinks, setNewLinks] = useState<CreatedGuest[]>([]);
  const [newSlug, setNewSlug] = useState<string | null>(null);

  const parsedGuestCount = useMemo(
    () => parseGuestsFromText(form.guestsText).length,
    [form.guestsText],
  );

  async function refreshEvents() {
    setIsLoadingEvents(true);
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      const payload = (await response.json()) as { events?: EventSummary[] };
      setEvents(payload.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    fetch("/api/events", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { events?: EventSummary[] };
        if (isActive) {
          setEvents(payload.events ?? []);
        }
      })
      .catch(() => {
        if (isActive) {
          setEvents([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingEvents(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setNewLinks([]);
    setNewSlug(null);
    setIsCreating(true);

    try {
      const guests = parseGuestsFromText(form.guestsText);
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          eventDate: form.eventDate,
          location: form.location,
          message: form.message,
          guests,
        }),
      });

      const payload = (await response.json()) as CreateResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "No se pudo crear la invitación.");
        return;
      }

      setSuccess("Evento creado. Ya podés compartir las invitaciones.");
      setNewLinks(payload.guests ?? []);
      setNewSlug(payload.event.slug);
      setForm(initialForm);
      await refreshEvents();
    } catch {
      setError("No se pudo crear la invitación.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[#cc5c33]">
          Invitaciones de cumpleaños
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#15233b] sm:text-4xl">
          Crea una invitación y controla asistencias en un solo link
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
          Cargas el evento, agregas invitados y cada persona confirma con un
          botón de sí o no. Desde tu panel ves confirmados, rechazados y
          pendientes.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-[#15233b]">Nuevo evento</h2>
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">
                Título del cumpleaños
              </span>
              <input
                required
                value={form.title}
                onChange={(e) =>
                  setForm((current) => ({ ...current, title: e.target.value }))
                }
                placeholder="Ej: Cumple de Sofi"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-[#cc5c33]"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Fecha y hora</span>
              <input
                type="datetime-local"
                required
                value={form.eventDate}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    eventDate: e.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-[#cc5c33]"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Lugar</span>
              <input
                required
                value={form.location}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    location: e.target.value,
                  }))
                }
                placeholder="Dirección o salón"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-[#cc5c33]"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">
                Mensaje (opcional)
              </span>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) =>
                  setForm((current) => ({ ...current, message: e.target.value }))
                }
                placeholder="Traer malla, habrá pileta..."
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-[#cc5c33]"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">
                Invitados (uno por línea: nombre, contacto opcional)
              </span>
              <textarea
                rows={5}
                value={form.guestsText}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    guestsText: e.target.value,
                  }))
                }
                placeholder={"Ana Pérez, +54911...\nCarlos López, carlos@mail.com"}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-[#cc5c33]"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-xl bg-[#15233b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#223a60] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreating ? "Creando..." : "Crear evento"}
              </button>
              <p className="text-sm text-slate-500">
                Invitados detectados: {parsedGuestCount}
              </p>
            </div>
          </form>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </p>
          ) : null}

          {newSlug ? (
            <p className="mt-3 text-sm text-slate-700">
              Panel del anfitrión:{" "}
              <Link
                className="font-semibold text-[#cc5c33] hover:underline"
                href={`/evento/${newSlug}`}
              >
                /evento/{newSlug}
              </Link>
            </p>
          ) : null}

          {newLinks.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700">
                Links de invitación recién creados
              </h3>
              <ul className="mt-3 grid gap-2 text-sm">
                {newLinks.map((guest) => (
                  <li
                    key={guest.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <span className="font-medium text-slate-700">
                      {guest.name}
                    </span>
                    <Link
                      className="font-mono text-xs text-[#cc5c33] hover:underline"
                      href={`/invitacion/${guest.token}`}
                    >
                      /invitacion/{guest.token}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-[#15233b]">
            Eventos recientes
          </h2>
          {isLoadingEvents ? (
            <p className="mt-4 text-sm text-slate-500">Cargando eventos...</p>
          ) : events.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Aún no hay eventos creados.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {events.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(item.eventDate).toLocaleString("es-AR")}
                      </p>
                      <p className="text-xs text-slate-500">{item.location}</p>
                    </div>
                    <Link
                      href={`/evento/${item.slug}`}
                      className="text-sm font-semibold text-[#cc5c33] hover:underline"
                    >
                      Ver panel
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Sí: {item.stats.yes} | No: {item.stats.no} | Pendientes:{" "}
                    {item.stats.pending} | Total invitados: {item.totalGuests}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
