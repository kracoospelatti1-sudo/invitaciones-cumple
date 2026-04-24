"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type InvitationRow = {
  id: number;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  eventDate: string;
  location: string;
  hostViewToken: string;
  clientName: string;
  totalRsvps: number;
};

type SessionState = {
  configured: boolean;
  authenticated: boolean;
};

const initialForm = {
  clientName: "",
  clientContact: "",
  clientNotes: "",
  title: "",
  eventDate: "",
  location: "",
  message: "",
  coverImageUrl: "",
  status: "DRAFT",
  photosText: "",
  quotesText: "",
};

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AdminHomeClient() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const photoCount = useMemo(() => parseLines(form.photosText).length, [form.photosText]);
  const quoteCount = useMemo(() => parseLines(form.quotesText).length, [form.quotesText]);

  async function readSession() {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    const payload = (await response.json()) as SessionState;
    return payload;
  }

  async function fetchInvitations() {
    setIsLoadingInvitations(true);
    try {
      const response = await fetch("/api/invitations", { cache: "no-store" });
      const payload = (await response.json()) as { invitations?: InvitationRow[] };
      setInvitations(payload.invitations ?? []);
    } finally {
      setIsLoadingInvitations(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as SessionState;
        if (!active) return;
        setSession(payload);
        if (payload.authenticated) {
          await fetchInvitations();
        }
      })
      .catch(() => {
        if (!active) return;
        setSession({ configured: false, authenticated: false });
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    setIsLoginLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setLoginError(payload.error ?? "No se pudo iniciar sesion.");
        return;
      }
      setLoginPassword("");
      const currentSession = await readSession();
      setSession(currentSession);
      if (currentSession.authenticated) {
        await fetchInvitations();
      }
    } catch {
      setLoginError("No se pudo iniciar sesion.");
    } finally {
      setIsLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setSession({ configured: true, authenticated: false });
    setInvitations([]);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setCreateMessage(null);
    setIsCreating(true);
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          clientContact: form.clientContact,
          clientNotes: form.clientNotes,
          title: form.title,
          eventDate: form.eventDate,
          location: form.location,
          message: form.message,
          coverImageUrl: form.coverImageUrl,
          status: form.status,
          photos: parseLines(form.photosText),
          quotes: parseLines(form.quotesText),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        invitation?: { slug: string };
      };
      if (!response.ok) {
        setCreateError(payload.error ?? "No se pudo crear la invitacion.");
        return;
      }
      setForm(initialForm);
      setCreateMessage("Invitacion creada correctamente.");
      await fetchInvitations();
    } catch {
      setCreateError("No se pudo crear la invitacion.");
    } finally {
      setIsCreating(false);
    }
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm text-[var(--muted)]">Cargando panel...</p>
      </main>
    );
  }

  if (!session.configured) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl border border-black/10 bg-[var(--surface)] p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Panel administrador</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Falta configurar <code>ADMIN_PASSWORD</code> en variables de entorno.
          </p>
        </section>
      </main>
    );
  }

  if (!session.authenticated) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl border border-black/10 bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[var(--accent)]">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">Ingresar al panel</h1>
          <form className="mt-4 grid gap-3" onSubmit={handleLogin}>
            <label className="grid gap-1 text-sm">
              <span>Clave</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
            </label>
            <button
              disabled={isLoginLoading}
              className="w-fit rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              type="submit"
            >
              {isLoginLoading ? "Ingresando..." : "Entrar"}
            </button>
          </form>
          {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="rounded-2xl border border-black/10 bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--accent)]">Panel admin</p>
            <h1 className="text-2xl font-semibold">Nueva invitacion</h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            type="button"
          >
            Cerrar sesion
          </button>
        </div>

        <form className="mt-5 grid gap-3" onSubmit={handleCreate}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Cliente</span>
              <input
                value={form.clientName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, clientName: event.target.value }))
                }
                required
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Contacto cliente</span>
              <input
                value={form.clientContact}
                onChange={(event) =>
                  setForm((current) => ({ ...current, clientContact: event.target.value }))
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Notas cliente</span>
            <textarea
              rows={2}
              value={form.clientNotes}
              onChange={(event) =>
                setForm((current) => ({ ...current, clientNotes: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Titulo invitacion</span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              required
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Fecha y hora</span>
              <input
                type="datetime-local"
                value={form.eventDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, eventDate: event.target.value }))
                }
                required
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Estado</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Lugar</span>
            <input
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
              required
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Mensaje</span>
            <textarea
              rows={3}
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({ ...current, message: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Foto principal (URL)</span>
            <input
              value={form.coverImageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, coverImageUrl: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Fotos adicionales (una URL por linea)</span>
              <textarea
                rows={4}
                value={form.photosText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, photosText: event.target.value }))
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--muted)]">{photoCount} fotos</span>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Frases (una por linea)</span>
              <textarea
                rows={4}
                value={form.quotesText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, quotesText: event.target.value }))
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--muted)]">{quoteCount} frases</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="w-fit rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isCreating ? "Creando..." : "Crear invitacion"}
          </button>
          {createMessage ? <p className="text-sm text-emerald-700">{createMessage}</p> : null}
          {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
        </form>
      </section>

      <section className="rounded-2xl border border-black/10 bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Invitaciones</h2>
        {isLoadingInvitations ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Cargando...</p>
        ) : invitations.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Todavia no hay invitaciones.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {invitations.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  Cliente: {item.clientName} | Estado: {item.status}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {new Date(item.eventDate).toLocaleString("es-AR")} - {item.location}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Respuestas: {item.totalRsvps}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Link className="font-semibold text-[var(--accent)] underline" href={`/i/${item.slug}`}>
                    Ver landing
                  </Link>
                  <Link
                    className="font-semibold text-[var(--accent)] underline"
                    href={`/panel-host/${item.hostViewToken}`}
                  >
                    Ver panel host
                  </Link>
                  <Link
                    className="font-semibold text-[var(--accent)] underline"
                    href={`/admin/invitaciones/${item.slug}`}
                  >
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
