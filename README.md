# canchaAbierta

Plataforma web para encontrar jugadores y unirse a partidos de **pádel** y **babyfútbol** en Chile. Los jugadores se autentican con Google, se inscriben a un partido y pagan con **Flow.cl** (Transbank Webpay). El admin gestiona canchas, partidos y sobrecupos desde un panel propio.

> **Estado actual: Fase 2 — Registro e inscripción (en curso).** Ver checklist completo en [`docs/PLAN.md`](./docs/PLAN.md) §8.

---

## Indice

- [Que es y que no es](#que-es-y-que-no-es)
- [Roles](#roles)
- [Stack tecnico](#stack-tecnico)
- [Features](#features)
- [Quickstart local](#quickstart-local)
- [Scripts](#scripts)
- [Variables de entorno](#variables-de-entorno)
- [Estructura del repo](#estructura-del-repo)
- [Arquitectura y flujos criticos](#arquitectura-y-flujos-criticos)
- [Documentacion](#documentacion)
- [Convenciones y como contribuir](#convenciones-y-como-contribuir)
- [Estado del proyecto](#estado-del-proyecto)

---

## Que es y que no es

**Si**
- Inscripcion + pago online de partidos para dos deportes (padel, babyfutbol) en Chile
- Panel admin para gestionar canchas, partidos, jugadores y sobrecupos
- Datos en Google Sheets (fuente unica de verdad) accesible para el admin sin entrar a la app
- Lock distribuido en Redis para evitar dobles inscripciones bajo concurrencia
- Webhooks firmados de Flow con dedupe por token

**No**
- No es multi-idioma (es-CL fijo), ni multi-moneda (CLP fijo)
- No usa Prisma/Drizzle/Mongo/Postgres. Toda la persistencia es Sheets + Redis
- No hay app movil. Solo web responsive
- No incluye notificaciones WhatsApp, ELO, ni comentarios de canchas (ver [PLAN.md §13](./docs/PLAN.md))

---

## Roles

| Rol | Como se asigna | Puede |
|---|---|---|
| **Visitante** | sin login | ver landings, canchas, partidos, detalle |
| **Jugador** | login con Google (cualquier email) | completar perfil, inscribirse y pagar, ver sus inscripciones y notificaciones |
| **Admin** | el callback `jwt` promueve automaticamente si `email ∈ ALLOWED_ADMIN_EMAILS` | todo lo anterior + `/admin/*` (CRUD canchas/partidos, aprobar sobrecupos, audit log) |

> No hay UI de auto-promocion. Agregar un admin requiere redeploy con la nueva env var.

---

## Stack tecnico

| Capa | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript estricto |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Auth | Auth.js v5 (NextAuth) con Google provider, JWT en cookie httpOnly |
| Data | Google Sheets API (`googleapis`) con service account JWT |
| Sync Sheets ↔ app | Apps Script `onChange` trigger → `POST /api/sheets/revalidate` → `revalidateTag` |
| Pagos | Flow.cl (Transbank Webpay REST) |
| Emails | Resend + React Email |
| Lock + idempotencia | Vercel KV (Upstash Redis) via `KV_REDIS_URL` |
| Zona horaria | `date-fns-tz` con `America/Santiago` (unica TZ soportada) |
| Validacion | Zod (schemas espejo de cada hoja) |
| Tests E2E | Playwright (pendiente configurar en Fase 4) |
| Hosting | Vercel |

---

## Features

### Implementadas (Fase 0 + 1 + 2)

- **Bootstrap**: scaffold Next.js + TS estricto + Tailwind + alias `@/` + Prettier + ESLint
- **Sheets**: cliente googleapis con JWT, 7 hojas definidas con Zod, normalizacion de booleanos (`TRUE`/`true`), serial de fecha → ISO
- **Listados publicos**: `/canchas` y `/partidos` con filtros via `searchParams`, server-side, cache por tag
- **Detalle**: `/canchas/[id]` y `/partidos/[id]` con cupos, precio y reglas
- **Sync en tiempo real**: Apps Script `onChange` → POST firmado → `revalidateTag` por hoja
- **ISR de respaldo**: `revalidate = 60` por si falla el webhook de Apps Script
- **Auth Google**: Auth.js v5, callback `jwt` inyecta `isAdmin`
- **Middleware**: protege `/cuenta/*` (logged-in) y `/admin/*` (admin-only)
- **Perfil**: `/cuenta/perfil` con formulario + Zod; persistido en hoja `Jugadores`
- **Inscripcion + pago**: server action `inscribirse()` con lock por `matchId` → crea intencion Flow → acta pagar `pending` en Sheets → redirect a Flow
- **Webhook Flow**: valida firma HMAC, dedupe en Redis (TTL 24h), confirma pago, incrementa `currentPlayers`, notifica
- **Sobrepaso con confirmacion**: si partido lleno y `allowOverbook=true`, la inscripcion queda `overbookRequested=true` hasta aprobacion del admin
- **Paginas cuenta**: `/cuenta/mis-inscripciones`, `/cuenta/notificaciones`

### Pendientes (Fase 2 + 4)

- Plantilla React Email `inscription-confirmed.tsx` (Fase 2)
- Panel admin completo (Fase 3): CRUD canchas, CRUD partidos, gestion de sobrecupos, audit log
- Tests E2E con Playwright (Fase 4)
- Pase de Flow sandbox a produccion (Fase 4)

---

## Quickstart local

### Requisitos

- Node.js 20+
- npm 10+
- Una cuenta Google Cloud con Sheets API habilitada y un service account con JSON key
- El Google Sheets compartido con el email del service account (permiso Editor)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local
# completar las 17 variables (ver [Variables de entorno](#variables-de-entorno) y docs/*.md)

# 3. Dev server
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

> Sin `KV_REDIS_URL` los webhooks y locks no funcionan, pero las paginas publicas si. Sin `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` no hay data.

---

## Scripts

| Comando | Que hace |
|---|---|
| `npm run dev` | Dev server (Turbopack por defecto en Next 15) |
| `npm run build` | Build de produccion |
| `npm run start` | Servidor de produccion local |
| `npm run lint` | ESLint (config Next) |
| `npm run typecheck` | `tsc --noEmit` |

> `npm run test:e2e` se agregara cuando se configure Playwright en Fase 4.

---

## Variables de entorno

17 variables agrupadas en 8 grupos. Lista canonica con descripcion inline en [`.env.example`](./.env.example).

| Grupo | Variables | Donde se obtienen |
|---|---|---|
| Next.js | `NEXT_PUBLIC_SITE_URL` | URL publica del deploy (http://localhost:3000 en dev) |
| Auth.js | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | [docs/AUTH_SETUP.md](./docs/AUTH_SETUP.md) |
| Admin | `ALLOWED_ADMIN_EMAILS` | CSV de emails con permisos |
| Sheet | `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | [docs/GOOGLE_CLOUD_SETUP.md](./docs/GOOGLE_CLOUD_SETUP.md) y [docs/SHEETS_SCHEMA.md](./docs/SHEETS_SCHEMA.md) |
| Apps Script | `SHEETS_REVALIDATE_SECRET` | Token cualquiera (>=32 chars); debe coincidir con el pegado en Apps Script |
| Flow.cl | `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL`, `FLOW_WEBHOOK_URL` | [docs/FLOW_CL_SETUP.md](./docs/FLOW_CL_SETUP.md) |
| Resend | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | [docs/RESEND_SETUP.md](./docs/RESEND_SETUP.md) |
| Vercel KV | `KV_REDIS_URL` | Provisionar Redis en Vercel Storage; pegar `KV_REDIS_URL` del Quickstart |

> Los `*.local` ya estan en `.gitignore`. Solo se commitea `.env.example`.

---

## Estructura del repo

```
canchaAbierta/
├── app/
│   ├── (public)/                     # landings, listados, detalle, sign-in
│   │   ├── canchas/                  # /canchas, /canchas/[id]
│   │   ├── partidos/                 # /partidos, /partidos/[id]
│   │   ├── auth/signin/
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── (account)/                    # /cuenta/* — login requerido
│   │   └── cuenta/
│   │       ├── perfil/               # formulario de perfil
│   │       ├── mis-inscripciones/    # listado del jugador
│   │       └── notificaciones/       # inbox in-app
│   ├── api/
│   │   ├── auth/[...nextauth]/       # Auth.js
│   │   ├── flow/webhook/             # POST confirmacion de pago (firma HMAC)
│   │   └── sheets/revalidate/        # POST desde Apps Script (X-Secret)
│   ├── layout.tsx
│   ├── page.tsx                      # landing
│   └── globals.css
├── components/
│   ├── ui/                           # shadcn/ui (Button, Card, Input, Badge)
│   ├── courts/                       # court-card, court-filters
│   ├── matches/                      # match-card, match-filters
│   ├── inscriptions/                 # inscribirse-form
│   ├── account/                      # profile-form
│   ├── auth-menu.tsx
│   ├── site-header.tsx
│   └── sheets-notice.tsx
├── lib/
│   ├── sheets/
│   │   ├── client.ts                 # JWT auth del service account
│   │   ├── read.ts                   # helper de lectura por hoja
│   │   ├── mutate.ts                 # helper de escritura por hoja
│   │   ├── tags.ts                   # SHEET_TAGS + helpers por entidad
│   │   ├── schemas.ts                # Zod espejo de las 7 hojas
│   │   └── repos/                    # 1 archivo por hoja: venues, courts, matches,
│   │                                 # inscriptions, players, notifications, audit
│   ├── auth/
│   │   ├── config.ts                 # Auth.js v5
│   │   ├── admins.ts                 # isAdminEmail()
│   │   ├── actions.ts                # server actions de sesion
│   │   └── callback-path.ts          # interna del flujo
│   ├── flow/
│   │   ├── client.ts                 # createFlowPayment
│   │   ├── confirm-payment.ts        # llamado desde el webhook
│   │   └── signature.ts              # HMAC firmar/validar
│   ├── email/
│   │   └── client.ts                 # Resend
│   ├── locks/match-lock.ts           # withMatchLock(matchId, fn)
│   ├── redis/
│   │   ├── client.ts                 # cliente Upstash
│   │   └── webhook-dedupe.ts         # markFlowWebhookProcessed(token)
│   ├── actions/                      # server actions
│   │   ├── profile.ts                # updateProfile
│   │   └── inscribirse.ts            # inscribirse(matchId)
│   ├── catalog.ts                    # agregaciones cross-hoja (match+venue+court+cupo)
│   ├── routes.ts                     # constantes de paths
│   ├── search-params.ts              # parsers Zod de searchParams
│   ├── format.ts                     # CLP, etc.
│   ├── time.ts                       # helpers America/Santiago
│   └── utils.ts                      # cn() y similares
├── emails/                           # React Email templates (pendiente Fase 2)
├── types/
├── docs/                             # ver [Documentacion](#documentacion)
├── middleware.ts                     # protege /admin/* y /cuenta/*
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Arquitectura y flujos criticos

### Diagrama

```
[Admin]  ──edita──▶ [Google Sheets] ──onChange──▶ [Apps Script]
                                                    │
                                                    ▼ POST /api/sheets/revalidate (X-Secret)
                                                    │
[Player] ──login──▶ [Next.js (Vercel)] ◀──revalidateTag──┘
   │                       │
   │                       ├── lee Sheets (cached, tag-based)
   │                       ├── Server Actions (admin CRUD)
   │                       ├── crea intencion de pago ──▶ [Flow.cl]
   │                       │                                │
   │   ◀── redirect ───────┤                                │
   │                       │                                │
   │                       ◀── webhook firmado ─────────────┘
   │                       │
   │                       ├── verifica firma + dedupe en Redis
   │                       ├── marca Inscripcion pagada
   │                       ├── libera lock del match
   │                       ├── email (Resend)
   │                       └── escribe Notificacion in-app
```

### Flujo de inscripcion (paso a paso)

1. Jugador autenticado va a `/partidos/[id]` y envia el form "Inscribirme y pagar".
2. Server action `inscribirse()`:
   1. Lee sesion (`auth()`). Sin sesion → redirect a `/auth/signin`
   2. Lee jugador de Sheets. Si falta nombre/telefono → redirect a `/cuenta/perfil`
   3. Lee match view. Si no existe o no esta `open` → redirect con `error=partido`
   4. Toma lock `withMatchLock(matchId, ...)`
   5. Busca inscripcion activa del jugador para ese match
      - si ya esta `paid` → redirect a mis inscripciones
      - si esta `pending` → redirect a mis inscripciones (reintento de pago)
   6. Cuenta inscripciones pagadas
   7. Si lleno y `!allowOverbook` → redirect con `error=cupo`
   8. Si lleno y `allowOverbook` → marca `overbookRequested=true`
   9. Llama `createFlowPayment({ commerceOrder: inscriptionId, ... })`
   10. Escribe Inscripcion con `paymentStatus=pending` en Sheets
   11. Revalida tags `inscriptions:<matchId>` y `match:<matchId>`
   12. Libera lock
   13. Redirect a `payment.url` (Flow)
3. Jugador paga en Flow.
4. Flow llama `POST /api/flow/webhook` con `?token=...&s=<firma>`.
5. Route handler:
   1. Verifica firma HMAC con `FLOW_SECRET_KEY`. Sin firma → 401
   2. Dedupe en Redis por token (TTL 24h). Duplicado → 200 idempotente
   3. `confirmFlowPayment(token)` lee Sheets, marca Inscripcion `paid`, incrementa `currentPlayers` en Partidos
   4. Si `overbookRequested` → encola notificacion al admin
   5. Encola email al jugador + Notificacion in-app
   6. Revalida tags afectados

### Flujo de sync Sheets → app

1. Admin edita una celda (canchas, partidos, etc).
2. Trigger Apps Script `onChange` ejecuta `notifyRevalidation(sheet)`.
3. POST a `${NEXT_PUBLIC_SITE_URL}/api/sheets/revalidate` con header `X-Secret: ${SHEETS_REVALIDATE_SECRET}` y body `{ sheet }`.
4. Route handler mapea `sheet` → `SHEET_TAGS[sheet]` y llama `revalidateTag`.
5. Proxima lectura de esa hoja se sirve fresca.
6. Si el webhook no llega en 60s, el ISR (`revalidate = 60`) rescata.

---

## Documentacion

Toda la documentacion vive en [`docs/`](./docs/). Orden recomendado para llegar de cero a deploy:

| # | Doc | Que cubre |
|---|---|---|
| 0 | [PLAN.md](./docs/PLAN.md) | Arquitectura, modelo de datos (7 hojas), fases, riesgos, matriz de permisos, testing |
| 1 | [GOOGLE_CLOUD_SETUP.md](./docs/GOOGLE_CLOUD_SETUP.md) | Proyecto GCP, habilitar Sheets API, crear service account + JSON key, OAuth client |
| 2 | [SHEETS_SCHEMA.md](./docs/SHEETS_SCHEMA.md) | Headers de las 7 hojas, filas de ejemplo, scripts de bootstrap |
| 3 | [APPS_SCRIPT_SETUP.md](./docs/APPS_SCRIPT_SETUP.md) | Instalar el trigger `onChange` para sync en tiempo real |
| 4 | [AUTH_SETUP.md](./docs/AUTH_SETUP.md) | Auth.js v5 con Google provider + admin allowlist |
| 5 | [FLOW_CL_SETUP.md](./docs/FLOW_CL_SETUP.md) | Cuenta Flow, API keys, sandbox vs produccion, contrato API |
| 6 | [RESEND_SETUP.md](./docs/RESEND_SETUP.md) | Verificar dominio, API key, remitente |
| 7 | [DEPLOY.md](./docs/DEPLOY.md) | Deploy en Vercel, env vars, KV, dominio custom |

Ademas:

- [`AGENTS.md`](./AGENTS.md) — contexto para agentes AI / colaboradores: reglas no negociables, estructura, skills recomendadas
- [`scripts/setup-sheets.gs`](./docs/scripts/setup-sheets.gs) — script Apps Script para crear las 7 hojas (sin service account)
- [`scripts/bootstrap-sheets.mjs`](./docs/scripts/bootstrap-sheets.mjs) — script Node para crear las 7 hojas via API
- [`scripts/apps-script.gs`](./docs/scripts/apps-script.gs) — codigo del trigger `onChange` para copiar/pegar

---

## Convenciones y como contribuir

Ver detalle completo en [`AGENTS.md`](./AGENTS.md). Resumen:

- **No agregar comentarios al codigo** salvo pedido explicito
- **No commitear secrets** (`.env*.local` ignorados)
- **No barrel imports** (importar directo desde el archivo)
- **Server Components por defecto**; `'use client'` solo si hay estado/efectos
- **Validar todo input con Zod** (incluidos `searchParams` y bodies de Route Handlers)
- **Toda mutacion al Sheets pasa por `lib/sheets/repos/`** + Server Action autenticado
- **Toda escritura que afecte `currentPlayers` toma lock en `lib/locks/match-lock.ts` primero**
- **Idempotencia de webhooks Flow**: dedupe en Redis por `token` (TTL 24h) antes de mutar
- **Branching**: `main` (prod) ← `develop` (integracion) ← `feature/*`
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- **Pre-merge**: `npm run lint` y `npm run typecheck` limpios
- **Cargar skill `vercel-react-best-practices`** antes de tocar componentes React/Next

---

## Estado del proyecto

**Fase 2 — Registro e inscripcion (en curso).** Falta un solo item de esta fase: la plantilla React Email `inscription-confirmed.tsx`.

Siguiente bloque: **Fase 3 — Panel admin** (CRUDs + audit + gestion de sobrecupos).

Detalles, fechas y checklist completo en [`docs/PLAN.md`](./docs/PLAN.md) §8.