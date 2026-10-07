# AGENTS.md — contexto para agentes

> Este archivo es leido por agentes (humanos o AI) que llegan al repo sin contexto previo. **Lelo entero antes de hacer cambios.**

## Indice

1. [Que es canchaAbierta](#1-que-es-canchaabierta)
2. [Stack y decisiones clave](#2-stack-y-decisiones-clave)
3. [Reglas no negociables](#3-reglas-no-negociables)
4. [Estructura del repo](#4-estructura-del-repo)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Comandos](#6-comandos)
7. [Skills recomendadas](#7-skills-recomendadas)
8. [Convenciones de codigo](#8-convenciones-de-codigo)
9. [Modelo de Sheets (resumen)](#9-modelo-de-sheets-resumen)
10. [Flujos criticos](#10-flujos-criticos)
11. [Estado del proyecto](#11-estado-del-proyecto)
12. [Como trabajar en este repo](#12-como-trabajar-en-trabajar-en-este-repo)

---

## 1. Que es canchaAbierta

App web chilena para que jugadores se inscriban y paguen partidos de **padel** y **babyfutbol**, y para que el admin gestione canchas y partidos.

**Caracteristicas distintivas** (las que no se pueden cambiar sin reconsiderar toda la arquitectura):

- La fuente de datos es un **Google Sheets** compartido. No hay DB tradicional (no Prisma, no Drizzle, no Postgres, no Mongo). El admin edita el Sheets directo o desde el panel admin.
- Los pagos van por **Flow.cl (Transbank Webpay REST)** con webhooks firmados HMAC.
- **Concurrencia** se resuelve con un lock distribuido en Vercel KV (Upstash Redis).
- Zona horaria unica: `America/Santiago`. Las fechas se guardan ISO 8601 y se convierten solo al mostrar al usuario.
- Multi-pais/moneda no esta soportado. es-CL + CLP.

- **Sheets ID**: `1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM`
- **URL**: https://docs.google.com/spreadsheets/d/1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM/edit?usp=sharing

---

## 2. Stack y decisiones clave

| Capa | Tecnologia | Por que |
|---|---|---|
| Framework | **Next.js 15 App Router** + **TypeScript estricto** | Server Components, Server Actions, deploy nativo en Vercel |
| Estilos | **Tailwind v4** + **shadcn/ui** | UI accesible, copiable, sin lock-in |
| Auth | **Auth.js v5** (NextAuth) con **Google provider** | Login con Google, JWT en cookie httpOnly, allowlist de admins |
| Data | **Google Sheets API** (`googleapis`) + service account JWT | Requisito del proyecto |
| Sync Sheets ↔ app | **Apps Script `onChange` trigger** → `/api/sheets/revalidate` → `revalidateTag` | Sin polling, refresh casi instantaneo |
| Pagos | **Flow.cl (Transbank Webpay REST)** | Estandar chileno, webhooks firmados HMAC |
| Emails | **Resend** + **React Email** | Confirmaciones, recordatorios, plantillas en JSX |
| Lock + idempotencia | **Vercel KV** (Upstash Redis) via `KV_REDIS_URL` | Lock por matchId, dedupe de webhooks Flow (TTL 24h) |
| Zona horaria | `date-fns-tz` con `America/Santiago` | **SIEMPRE** convertir a esta TZ al parsear fechas del Sheets |
| Validacion | **Zod** | Schemas espejo de cada hoja del Sheets; validar cliente + servidor |
| Tests E2E | **Playwright** | Pendiente configurar en Fase 4 |

**No usamos** y **no agregues** sin discutir: Prisma, Drizzle, MongoDB, Postgres, otra DB. Toda persistencia es Sheets + Redis.

---

## 3. Reglas no negociables

Violar cualquiera de estas requiere aprobacion explicita del usuario.

1. **No agregar comentarios al codigo** salvo que el usuario lo pida explicitamente.
2. **No commitear secrets**. Solo `.env.example` se versiona; los `.env*.local`, `service-account.json`, `client_secret_*.json` estan en `.gitignore`.
3. **No usar barrel imports** que importen modulos grandes sin necesidad (ver regla `bundle-barrel-imports` de la skill `vercel-react-best-practices`). Importar directo desde el archivo concreto.
4. **Server Components por defecto**. `'use client'` solo cuando hay estado, efectos, event handlers o APIs del navegador.
5. **Validar todo input con Zod**, incluidos `searchParams` (usar `lib/search-params.ts`) y bodies de Route Handlers.
6. **Toda mutacion al Sheets debe pasar por su repo en `lib/sheets/repos/`** y por un Server Action o Route Handler autenticado. Nunca escribir directo desde un componente.
7. **Concurrencia**: cualquier escritura que afecte `currentPlayers` de un partido debe tomar primero el lock distribuido en Redis via `withMatchLock(matchId, fn)` de `lib/locks/match-lock.ts`.
8. **Idempotencia de webhooks de Flow**: dedupe por `token` en `lib/redis/webhook-dedupe.ts` (TTL 24h) **antes** de mutar Sheets.
9. **No agregar dependencias nuevas** sin justificar. Preferir lo que ya esta en `package.json`. Si agregas, actualizar lockfile y documentar por que.
10. **No usar `Select-Object -First/Last` ni truncate en PowerShell** para acotar output. Usar `Read` con offset/limit o `Grep`.

---

## 4. Estructura del repo

```
canchaAbierta/
├── app/
│   ├── (public)/                  # landings, listados canchas/partidos, sign-in
│   │   ├── canchas/               # /canchas, /canchas/[id]
│   │   ├── partidos/              # /partidos, /partidos/[id]
│   │   ├── auth/signin/
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── (account)/                 # /cuenta/* — login requerido
│   │   └── cuenta/
│   │       ├── perfil/
│   │       ├── mis-inscripciones/
│   │       └── notificaciones/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # Auth.js
│   │   ├── flow/webhook/          # POST confirmacion de pago (firma HMAC)
│   │   └── sheets/revalidate/     # POST desde Apps Script (X-Secret)
│   ├── layout.tsx
│   ├── page.tsx                   # landing
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn/ui (Button, Card, Input, Badge)
│   ├── courts/                    # court-card, court-filters
│   ├── matches/                   # match-card, match-filters
│   ├── inscriptions/              # inscribirse-form
│   ├── account/                   # profile-form
│   ├── auth-menu.tsx              # dropdown sesion
│   ├── site-header.tsx            # nav superior
│   └── sheets-notice.tsx          # banner de error de Sheets
├── lib/
│   ├── sheets/
│   │   ├── client.ts              # googleapis + JWT auth del service account
│   │   ├── read.ts                # helper generico de lectura por hoja
│   │   ├── mutate.ts              # helper generico de escritura por hoja
│   │   ├── tags.ts                # SHEET_TAGS + matchTag()/inscriptionsTag()
│   │   ├── schemas.ts             # Zod espejo de las 7 hojas
│   │   └── repos/                 # 1 archivo por hoja:
│   │       ├── venues.ts          # listVenues, getVenue, upsertVenue, ...
│   │       ├── courts.ts
│   │       ├── matches.ts
│   │       ├── inscriptions.ts    # + countPaidInscriptionsForMatch, findActiveInscription, createPendingInscription
│   │       ├── players.ts         # + getPlayer
│   │       ├── notifications.ts
│   │       └── audit.ts
│   ├── auth/
│   │   ├── config.ts              # NextAuth v5 — handlers, callbacks jwt/session
│   │   ├── admins.ts              # isAdminEmail(email)
│   │   ├── actions.ts             # server actions de sesion (signOut, etc)
│   │   └── callback-path.ts
│   ├── flow/
│   │   ├── client.ts              # createFlowPayment
│   │   ├── confirm-payment.ts     # confirmFlowPayment(token) — llamado por webhook
│   │   └── signature.ts           # signFlowParams, verifyFlowSignature
│   ├── email/
│   │   └── client.ts              # Resend wrapper
│   ├── locks/
│   │   └── match-lock.ts          # withMatchLock(matchId, fn)
│   ├── redis/
│   │   ├── client.ts              # cliente Upstash (KV_REDIS_URL)
│   │   └── webhook-dedupe.ts      # markFlowWebhookProcessed(token)
│   ├── actions/                   # server actions agrupados por dominio
│   │   ├── profile.ts             # updateProfile(formData)
│   │   └── inscribirse.ts         # inscribirse(formData)
│   ├── catalog.ts                 # agregaciones cross-hoja (match+venue+court+cupo+price)
│   ├── routes.ts                  # constantes de paths (/partidos/[id], etc)
│   ├── search-params.ts           # parsers Zod para searchParams de filtros
│   ├── format.ts                  # CLP, etc
│   ├── time.ts                    # helpers America/Santiago (nowInSantiago, formatMatchDateTime, ...)
│   └── utils.ts                   # cn(), etc
├── emails/                        # React Email templates (pendiente: inscription-confirmed.tsx)
├── types/
├── docs/
│   ├── PLAN.md                    # plan maestro, fases, riesgos, matriz permisos
│   ├── GOOGLE_CLOUD_SETUP.md
│   ├── SHEETS_SCHEMA.md
│   ├── APPS_SCRIPT_SETUP.md
│   ├── AUTH_SETUP.md
│   ├── FLOW_CL_SETUP.md
│   ├── RESEND_SETUP.md
│   ├── DEPLOY.md
│   └── scripts/
│       ├── setup-sheets.gs
│       ├── bootstrap-sheets.mjs
│       └── apps-script.gs
├── tests/e2e/                     # Playwright (pendiente configurar)
├── middleware.ts                  # protege /admin/* y /cuenta/*
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Variables de entorno

Lista canonica con descripcion inline en [`.env.example`](../.env.example). **17 variables** en 8 grupos.

### Obligatorias para arrancar

| Variable | Por que |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Construir URLs de retorno Flow |
| `AUTH_SECRET` | Firmar JWT de Auth.js |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth |
| `ALLOWED_ADMIN_EMAILS` | CSV de emails admin |
| `GOOGLE_SHEETS_ID` | Workbook compartido (fijado en `.env.example`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email del service account |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key con `\n` escapados |

### Para pagos y emails

| Variable | Por que |
|---|---|
| `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL`, `FLOW_WEBHOOK_URL` | Crear intenciones y validar webhooks |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Enviar confirmaciones |

### Opcionales pero recomendadas

| Variable | Por que |
|---|---|
| `KV_REDIS_URL` | **Unica** variable de Vercel KV (Redis). Sin ella: locks y dedupe fallan, webhooks pueden duplicar |
| `SHEETS_REVALIDATE_SECRET` | Token compartido con Apps Script para autorizar `POST /api/sheets/revalidate` |

> En local sin Redis (sin `KV_REDIS_URL`), los listados publicos funcionan. Las inscripciones y webhooks fallan.

---

## 6. Comandos

| Comando | Que hace |
|---|---|
| `npm run dev` | Dev server (Turbopack por defecto en Next 15) |
| `npm run build` | Build de produccion |
| `npm run start` | Servidor de produccion local |
| `npm run lint` | ESLint (config Next) |
| `npm run typecheck` | `tsc --noEmit` |

`npm run test:e2e` se agregara cuando se configure Playwright en Fase 4.

---

## 7. Skills recomendadas

Antes de tocar codigo de Next.js / React, cargar la skill **`vercel-react-best-practices`** (disponible localmente). Cubre 70 reglas priorizadas por impacto: waterfalls, bundle size, server performance, re-renders. Las mas importantes para este proyecto:

- `async-parallel` — leer varias hojas en paralelo con `Promise.all`
- `bundle-barrel-imports` — importar directo, no barrels
- `bundle-dynamic-imports` — shadcn y React Email solo donde se usan
- `server-cache-react` — `React.cache` para dedupe per-request
- `server-auth-actions` — todo Server Action autenticado
- `rerender-defer-reads` — no subscribirse a estado solo para callbacks

Otras skills utiles segun la tarea:

- **`shadcn`** — al agregar componentes UI (revisar nombres en `components/ui/` primero)
- **`accessibility`** — al implementar formularios o navegacion
- **`react-performance-optimization`** — al optimizar renders

---

## 8. Convenciones de codigo

- **Naming**: `camelCase` para variables/funciones, `PascalCase` para componentes, `kebab-case` para archivos de ruta y utilidades.
- **Imports**: absolutos con `@/` (alias configurado). **Sin barrel imports** — importar directo desde el archivo.
- **Fechas**: siempre ISO 8601 en Sheets; convertir a `America/Santiago` **solo** para mostrar al usuario. Usar helpers de `lib/time.ts` (`formatMatchDateTime`, `formatShortDate`, etc).
- **Errores**: lanzar `Error` con mensaje en espanol; mapear a UI con `error.tsx` por segmento. En Server Actions, retornar `{ ok: true, data } | { ok: false, error }`.
- **Schemas Zod**: declarados en `lib/sheets/schemas.ts`. Reutilizar en client (formularios) + server (acciones y route handlers). Helpers de normalizacion: `requiredText`, `optionalText`, `requiredNumber`, `requiredBool`, `optionalBool`, `isoDate` (convierte serial de Sheets a ISO), `requiredEnum`, `optionalEnum`.
- **Server Actions**: nombre `verboSustantivo` (`createMatch`, `updateProfile`, `inscribirse`). Validar `formData` con Zod al inicio. Al final retornar `{ ok: true, data }` o `{ ok: false, error }`, o `redirect(...)` cuando aplique.
- **Booleanos en Sheets**: normalizar `TRUE`/`true` → `true` y `FALSE`/`false` → `false` via el transformer `requiredBool` del schema. **No** confiar en el tipo nativo que devuelve `googleapis` (puede llegar como string).
- **Cache**: lecturas por hoja con `unstable_cache` o `fetch` taggeado (`tags: [SHEET_TAGS.Canchas]`). Mutaciones invalidan con `revalidateTag(...)`.

---

## 9. Modelo de Sheets (resumen)

7 hojas en este orden exacto:

1. **Venues** — complejos deportivos. PK `id` (slug).
2. **Canchas** — FK a `Venues.id`; tiene `sport` (`padel`|`babyfutbol`), `capacity`, `priceCLP`.
3. **Partidos** — FK a `Canchas.id`; tiene `dateTime` (ISO), `maxPlayers`, `currentPlayers` (denormalizado, lo actualiza el webhook), `allowOverbook`, `requiresExtraConfirmation`, `status` (`open`|`closed`|`cancelled`|`completed`).
4. **Jugadores** — PK `email` (viene de Google OAuth). Campos: `name`, `phone`, `level`, `preferredPosition`, `createdAt`.
5. **Inscripciones** — FK a `Partidos.id` y `Jugadores.email`; `paymentStatus` (`pending`|`paid`|`failed`|`refunded`|`cancelled`), `flowToken`, `flowOrderId`, `overbookRequested`, `adminApproved`.
6. **Notificaciones** — in-app para jugadores. `type` enum: `inscription_confirmed`, `payment_received`, `match_cancelled`, `overbook_pending`, `overbook_approved`, `match_reminder`.
7. **AdminAudit** — log de cambios del admin. `action` (`create`|`update`|`delete`), `entity` (`venue`|`court`|`match`|`inscription`), `before`/`after` JSON string.

Detalle completo (columnas, tipos, notas) en [`docs/PLAN.md`](../docs/PLAN.md) §4.

---

## 10. Flujos criticos

### Inscripcion + pago (server action `inscribirse`)

Localizado en `lib/actions/inscribirse.ts`. Pasos:

1. `auth()` → si no hay sesion, redirect a `/auth/signin?callbackUrl=/partidos`.
2. Valida `matchId` con Zod desde `formData`.
3. Lee jugador via `getPlayer(email)`. Si falta `phone` o `name` → redirect a `/cuenta/perfil?callbackUrl=...`.
4. Lee match view via `getMatchView(matchId)` (`lib/catalog.ts`). Si no existe o `status !== "open"` → redirect con error.
5. `withMatchLock(matchId, async () => { ... })` — lock distribuido en Redis.
6. `findActiveInscription(matchId, email)`:
   - si `paymentStatus === "paid"` → redirect a mis inscripciones
   - si `paymentStatus === "pending"` → redirect a mis inscripciones con `estado=pending` (reintento)
7. `countPaidInscriptionsForMatch(matchId)` → calcula cupo.
8. Si lleno y `!allowOverbook` → redirect con `error=cupo`.
9. Si lleno y `allowOverbook` → `overbookRequested = true`.
10. `createFlowPayment({ commerceOrder: inscriptionId, ... })` → devuelve `{ token, url, flowOrder }`.
11. `createPendingInscription({ id, matchId, playerEmail, amountCLP, flowToken, flowOrderId, overbookRequested })`.
12. `revalidateTag(SHEET_TAGS.Inscripciones)`, `inscriptionsTag(matchId)`, `matchTag(matchId)`.
13. `redirect(payment.url)` — el jugador paga en su navegador.

### Webhook de Flow (`POST /api/flow/webhook`)

Localizado en `app/api/flow/webhook/route.ts`. Pasos:

1. Lee params (JSON o form-urlencoded).
2. Si viene `s=<firma>`: `verifyFlowSignature(params, FLOW_SECRET_KEY)` — HMAC-SHA256 con orden canonico. Sin firma o firma invalida → 401.
3. Valida `token` con Zod. Sin token → 400.
4. `markFlowWebhookProcessed(token)` en Redis (TTL 24h). Si ya estaba → responde `{"ok":true,"duplicate":true}` idempotente.
5. `confirmFlowPayment(token)` lee Sheets, marca Inscripcion como `paid`, incrementa `currentPlayers` en Partidos. Devuelve `{ matchId, paymentStatus }`.
6. `revalidateTag(...)` para los tags afectados.
7. Responde 200 con `{ ok: true, paymentStatus }`.

### Sync Sheets → app (Apps Script `onChange`)

1. Admin edita una celda en el Sheets.
2. Trigger Apps Script `onChange` ejecuta `notifyRevalidation(sheet)`.
3. POST a `${NEXT_PUBLIC_SITE_URL}/api/sheets/revalidate` con header `X-Secret: ${SHEETS_REVALIDATE_SECRET}` y body `{ sheet: "courts" | "matches" | ... }`.
5. Route handler en `app/api/sheets/revalidate/route.ts` valida el secret, mapea `sheet` → `SHEET_TAGS[sheet]`, llama `revalidateTag`.
6. Proxima lectura de esa hoja se sirve fresca.
7. **Backup**: ISR `revalidate = 60` en paginas publicas rescata si el webhook falla.

---

## 12. Estado del proyecto

**Fase 2 — Registro e inscripcion (en curso).** Item pendiente de esta fase: plantilla React Email `inscription-confirmed.tsx`.

Siguiente bloque: **Fase 3 — Panel admin** (CRUDs de canchas/partidos, gestion de sobrecupos, audit log). Despues: **Fase 4 — Endurecimiento** (Playwright, accesibilidad, sandbox→prod de Flow).

Detalles y checklist completo en [`docs/PLAN.md`](../docs/PLAN.md) §8.

Cuando termines una fase o un item, **marca los checkboxes** en `docs/PLAN.md` y actualiza el encabezado `Estado`.

---

## 13. Como trabajar en este repo

1. **Lee `docs/PLAN.md` entero** antes de tocar codigo.
2. **Lee este `AGENTS.md`** para no romper convenciones.
3. **Carga la skill `vercel-react-best-practices`** si vas a escribir componentes React/Next.js.
4. **Branching**: feature branches desde `develop`; PRs a `develop`. `main` solo por merges desde `develop` ya verificados.
5. **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
6. **Antes de commitear**: `npm run lint` y `npm run typecheck` limpios. Si agregaste test E2E, `npm run test:e2e`.
7. **No crees commits** a menos que el usuario lo pida explicitamente.