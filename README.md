# Invitaciones de Cumpleaños (Next.js + Hostinger MySQL)

MVP para crear eventos, generar links por invitado y registrar RSVP (`YES` / `NO`).

## Stack

- Next.js (App Router + TypeScript)
- Prisma ORM
- MySQL (Hostinger)

## Configurar base de datos Hostinger

1. Crea una base MySQL en el panel de Hostinger.
2. Habilita acceso remoto al host (si tu plan lo requiere).
3. Copia `.env.example` a `.env`.
4. Completa `DATABASE_URL`:

```env
DATABASE_URL="mysql://USUARIO:CLAVE@HOST:3306/NOMBRE_DB?sslaccept=strict"
```

## Crear tablas

Puedes usar una de estas dos opciones:

1. Prisma (recomendado):

```bash
npm run db:push
```

2. SQL manual:
   Ejecuta `database/hostinger-schema.sql` desde phpMyAdmin o cliente MySQL.

## Levantar proyecto

```bash
npm install
npm run prisma:generate
npm run dev
```

Abrir: `http://localhost:3000`

## Rutas UI

- `/` crear evento y ver eventos recientes.
- `/evento/[slug]` panel del anfitrión con estado de respuestas.
- `/invitacion/[token]` link público de RSVP para cada invitado.

## API (CRUD básico)

- `GET /api/events` lista eventos.
- `POST /api/events` crea evento + invitados iniciales.
- `GET /api/events/[slug]` detalle y métricas del evento.
- `POST /api/events/[slug]/guests` agrega invitados.
- `GET /api/invitaciones/[token]` detalle de invitación para RSVP.
- `POST /api/rsvp` crea/actualiza respuesta de invitado.

## Formato de invitados

En los formularios puedes cargar invitados así:

```text
Nombre Apellido, +54911...
Otro Invitado, correo@mail.com
Solo Nombre
```

El contacto es opcional.
