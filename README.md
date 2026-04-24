# MVP Invitaciones Personalizadas

Panel de administracion para crear invitaciones, landing publica para RSVP y panel privado de anfitrion por link con token.

## Stack

- Next.js 16 (App Router + TypeScript)
- Prisma ORM
- MySQL Hostinger

## Variables de entorno

Crear `.env` con:

```env
DATABASE_URL="mysql://USUARIO:CLAVE@HOST:3306/NOMBRE_DB?sslaccept=strict"
ADMIN_PASSWORD="tu-clave-admin"
ADMIN_SESSION_SECRET="secreto-largo-unico"
```

## Scripts

- `npm run dev` desarrollo local
- `npm run db:push` crear/sincronizar tablas
- `npm run prisma:generate` generar cliente Prisma
- `npm run build` build produccion

## Flujo recomendado local

1. `npm install`
2. `npm run db:push`
3. `npm run dev`
4. Abrir `http://localhost:3000`

## Rutas de producto

- `/` panel admin (login + alta/gestion)
- `/i/[slug]` landing publica para invitados
- `/panel-host/[token]` panel privado del anfitrion
- `/admin/invitaciones/[slug]` editor de una invitacion

## Endpoints API

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET/POST /api/invitations`
- `GET/PATCH/DELETE /api/invitations/:slug`
- `POST /api/invitations/:slug/photos`
- `POST /api/invitations/:slug/quotes`
- `GET /api/public/invitations/:slug`
- `POST /api/rsvp/:slug`
- `GET /api/host/:token/summary`
- `GET /api/health/db`
