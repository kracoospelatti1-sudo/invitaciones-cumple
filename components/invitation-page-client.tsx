"use client";

import { FormEvent, useEffect, useState } from "react";

type InvitationPayload = {
  guest: {
    name: string;
    token: string;
  };
  event: {
    title: string;
    eventDate: string;
    location: string;
    message: string | null;
  };
  rsvp: {
    status: "YES" | "NO";
    companions: number;
    comment: string | null;
    respondedAt: string;
  } | null;
  error?: string;
};

export function InvitationPageClient({ token }: { token: string }) {
  const [data, setData] = useState<InvitationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"YES" | "NO">("YES");
  const [companions, setCompanions] = useState(0);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function reloadInvitation() {
    try {
      const response = await fetch(`/api/invitaciones/${token}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as InvitationPayload;

      if (!response.ok) {
        setError(payload.error ?? "No se pudo abrir la invitación.");
        setData(null);
      } else {
        setError(null);
        setData(payload);
        if (payload.rsvp) {
          setStatus(payload.rsvp.status);
          setCompanions(payload.rsvp.companions);
          setComment(payload.rsvp.comment ?? "");
        }
      }
    } catch {
      setError("No se pudo abrir la invitación.");
      setData(null);
    }
  }

  useEffect(() => {
    let isActive = true;

    fetch(`/api/invitaciones/${token}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as InvitationPayload;
        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setError(payload.error ?? "No se pudo abrir la invitación.");
          setData(null);
          return;
        }

        setError(null);
        setData(payload);
        if (payload.rsvp) {
          setStatus(payload.rsvp.status);
          setCompanions(payload.rsvp.companions);
          setComment(payload.rsvp.comment ?? "");
        }
      })
      .catch(() => {
        if (isActive) {
          setError("No se pudo abrir la invitación.");
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
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setResult(null);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          status,
          companions: status === "YES" ? companions : 0,
          comment,
        }),
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setResult(payload.error ?? "No se pudo guardar tu respuesta.");
      } else {
        setResult(payload.message ?? "Respuesta guardada.");
        await reloadInvitation();
      }
    } catch {
      setResult("No se pudo guardar tu respuesta.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <p className="text-sm text-slate-500">Cargando invitación...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "Invitación no encontrada."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm uppercase tracking-[0.16em] text-[#cc5c33]">
          Invitación
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#15233b]">
          {data.event.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Hola {data.guest.name}, te esperamos el{" "}
          {new Date(data.event.eventDate).toLocaleString("es-AR")} en{" "}
          {data.event.location}.
        </p>
        {data.event.message ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {data.event.message}
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-[#15233b]">
          ¿Podés asistir?
        </h2>
        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="radio"
                name="status"
                checked={status === "YES"}
                onChange={() => setStatus("YES")}
              />
              Sí, voy
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="radio"
                name="status"
                checked={status === "NO"}
                onChange={() => setStatus("NO")}
              />
              No, no puedo
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Acompañantes</span>
            <input
              type="number"
              min={0}
              max={10}
              value={companions}
              disabled={status === "NO"}
              onChange={(event) => setCompanions(Number(event.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-[#cc5c33] disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">
              Comentario (opcional)
            </span>
            <textarea
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-[#cc5c33]"
              placeholder="Aviso alergias, horario estimado..."
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#15233b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#223a60] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Guardando..." : "Confirmar respuesta"}
          </button>
        </form>

        {result ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {result}
          </p>
        ) : null}

        {data.rsvp ? (
          <p className="mt-3 text-xs text-slate-500">
            Última respuesta: {new Date(data.rsvp.respondedAt).toLocaleString("es-AR")}
          </p>
        ) : null}
      </section>
    </main>
  );
}
