# AGENTS.md — contexto para agentes

> Este archivo es leído por agentes (humanos o AI) que llegan al repo sin contexto previo. Léelo entero antes de hacer cambios.

## 1. ¿Qué es canchaAbierta?

App web para que jugadores en Chile se inscriban y paguen partidos de **pádel** y **babyfútbol**, y para que el admin gestione canchas y partidos. La fuente de datos es un **Google Sheets** (no hay DB tradicional). Los pagos van por **Flow.cl (Transbank Webpay REST)**.

- **Sheets ID**: `1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM`
- **URL**: https://docs.google.com/spreadsheets/d/1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM/edit?usp=sharing

## 2. Stack y decisiones clave

| Capa | Tecnología | Por qué |
|---|---|---|
| Next.js | **15.x App Router** + **TypeScript estricto** | Server Components, Server Actions, deploy nativo en Vercel |
| Estilos | **Tailwind** + **shadcn/ui** | UI accesible, copiable, sin lock-in |
| Auth | **Auth.js v5** (NextAuth) con **Google provider** | Login con Google, JWT en cookie httpOnly |
| Data | **Google Sheets API** (`googleapis`) + service account | Requisito del proyecto |
| Sync Sheets ↔ app | **Apps Script `onChange` trigger** → `/api/sheets/revalidate` → `revalidateTag` | Sin polling |
| Pagos | **Flow.cl (Transbank Webpay REST)** | Estándar chileno, webhooks firmados |
| Emails | **Resend** + **React Email** | Confirmaciones, recordatorios |
| Lock + idempotencia | **Vercel KV** (Upstash Redis) | Locks de inscripción, dedupe de webhooks de Flow |
| Zona horaria | `date-fns-tz` con `America/Santiago` | **SIEMPRE** convertir a esta TZ al parsear fechas del Sheets |
| Validación | **Zod** | Schemas espejo de cada hoja del Sheets |

**No usamos**: Prisma, Drizzle, MongoDB, Postgres, ni otra DB. Toda la persistencia es Sheets + KV.

## 3. Reglas no negociables

1. **No agregar comentarios al código** salvo que el usuario lo pida explícitamente.
2. **No commitear secrets**. Solo `.env.example` se versiona; los `.env*.local` están en `.gitignore`.
3. **No usar barrel imports** (ver regla `bundle-barrel-imports` de la skill `vercel-react-best-practices`).
4. **Server Components por defecto**. `'use client'` solo cuando hay estado, efectos o event handlers.
5. **Validar todo input con Zod**, incluidos `searchParams` y bodies de Route Handlers.
6. **Toda mutación al Sheets debe pasar por su `repo` en `lib/sheets/repos/`** y por un Server Action o Route Handler autenticado.
7. **Concurrencia**: cualquier escritura que afecte `currentPlayers` de un partido debe tomar primero el lock distribuido en KV (ver `lib/locks/match-lock.ts`).
8. **Idempotencia de webhooks de Flow**: dedupe por `token` en KV (TTL 24h) antes de mutar Sheets.
9. **No agregar dependencias nuevas** sin justificar; preferir lo que ya está en `package.json`.
10. **No usar `Select-Object -First/Last` ni truncate en PowerShell** para acotar output; usar `Read` con offset/limit o `Grep`.

## 4. Estructura de carpetas

```
canchaAbierta/
├── app/                  # App Router
│   ├── (public)/         # landings, listados canchas/partidos, sign-in
│   ├── (account)/        # /cuenta/* — perfil, mis inscripciones, notificaciones
│   ├── (admin)/          # /admin/* — solo emails en ALLOWED_ADMIN_EMAILS
│   └── api/              # route handlers: auth, flow/webhook, sheets/revalidate
├── components/
│   ├── ui/               # shadcn/ui (componentes copiados, editables)
│   ├── courts/
│   ├── matches/
│   ├── inscriptions/
│   └── notifications/
├── lib/
│   ├── sheets/
│   │   ├── client.ts     # googleapis + JWT auth del service account
│   │   ├── repos/        # una carpeta/archivo por hoja (venues, courts, matches, …)
│   │   └── schemas.ts    # Zod schemas espejo del Sheets
│   ├── auth/
│   │   ├── config.ts     # NextAuth (Auth.js v5) config
│   │   └── admins.ts     # isAdminEmail(email)
│   ├── flow/
│   │   ├── client.ts     # crear intención de pago
│   │   └── verify-signature.ts
│   ├── email/
│   │   ├── client.ts     # Resend
│   │   └── templates/    # React Email
│   ├── locks/match-lock.ts
│   └── time.ts           # helpers America/Santiago
├── emails/               # React Email templates
├── types/
├── tests/e2e/            # Playwright
├── docs/
│   ├── PLAN.md
│   ├── SHEETS_SCHEMA.md  # cuando exista
│   ├── APPS_SCRIPT_SETUP.md
│   └── DEPLOY.md
└── ...
```

## 5. Variables de entorno

Ver `.env.example`. Las **obligatorias** para arrancar:

- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `GOOGLE_SHEETS_ID` (ya está fijada en el `.env.example`)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `ALLOWED_ADMIN_EMAILS` (comma-separated)

Para pagos y emails:

- `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_WEBHOOK_URL`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

Opcionales pero recomendadas:

- `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Vercel KV)
- `SHEETS_REVALIDATE_SECRET` (token compartido con Apps Script)

## 6. Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción local |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright |

## 7. Skills recomendadas

Antes de tocar código de Next.js / React, cargar la skill **`vercel-react-best-practices`** (ya está disponible localmente). Cubre 70 reglas priorizadas por impacto: waterfalls, bundle size, server performance, re-renders, etc. Las más importantes para este proyecto:

- `async-parallel` — leer varias hojas en paralelo
- `bundle-barrel-imports` — importar directo, no barrels
- `bundle-dynamic-imports` — shadcn y React Email solo donde se usan
- `server-cache-react` — `React.cache` para dedupe per-request
- `server-auth-actions` — todo Server Action autenticado
- `rerender-defer-reads` — no subscribirse a estado solo para callbacks

## 8. Convenciones de código

- **Naming**: `camelCase` para variables/funciones, `PascalCase` para componentes, `kebab-case` para archivos de ruta y utilidades.
- **Imports**: absolutos con `@/` (alias configurado).
- **Fechas**: siempre ISO 8601 en Sheets; convertir a `America/Santiago` solo para mostrar al usuario. Usar helpers de `lib/time.ts`.
- **Errores**: lanzar `Error` con mensaje en español; mapear a UI con `error.tsx` por segmento.
- **Schemas Zod**: un archivo por hoja en `lib/sheets/schemas.ts` (o desglosar si crece). Reutilizar en client + server.
- **Server Actions**: nombre `verboSustantivo` (ej. `createMatch`, `updateProfile`, `inscribirse`). Al final retornar `{ ok: true, data }` o `{ ok: false, error }`.

## 9. Modelo de Sheets (resumen rápido)

7 hojas en este orden:

1. **Venues** — complejos deportivos
2. **Canchas** —FK a Venues; tiene `sport` (padel/babyfutbol), `capacity`, `priceCLP`
3. **Partidos** — FK a Canchas; tiene `dateTime`, `maxPlayers`, `currentPlayers`, `allowOverbook`, `status`
4. **Jugadores** — PK `email`
5. **Inscripciones** — FK a Partidos y Jugadores; `paymentStatus`, `flowToken`, `overbookRequested`, `adminApproved`
6. **Notificaciones** — in-app para jugadores
7. **AdminAudit** — log de cambios del admin

Detalle completo en `docs/PLAN.md` §4.

## 10. Flujos críticos

### Inscripción + pago

1. Jugador autenticado va a `/partidos/[id]` y hace click en **Inscribirme y pagar**.
2. Server action `inscribirse(matchId)`:
   1. toma lock KV por `matchId`
   2. lee Partidos y cuenta Inscripciones pagadas
   3. valida cupo (`allowOverbook`, sobrecupo)
   4. crea intención en Flow (`commerceOrder = inscription.id`)
   5. escribe Inscripción con `paymentStatus=pending` en Sheets
   6. libera lock
   7. devuelve `redirectUrl` de Flow
3. Jugador paga en Flow.
4. Flow llama a `POST /api/flow/webhook` con firma.
5. Route handler:
   1. verifica firma
   2. dedupe en KV por `flowToken` (TTL 24h)
   3. marca Inscripción como `paid`, incrementa `currentPlayers` en Partidos
   4. si `overbookRequested` → notifica al admin
   5. email al jugador + Notificación in-app
6. El admin puede aprobar/rechazar el sobrecupo desde `/admin/partidos/[id]/inscripciones`.

### Sync Sheets → app

1. Admin edita una celda en el Sheets.
2. Trigger Apps Script `onChange` ejecuta `notifyRevalidation()`.
3. La función hace `POST` a `${NEXT_PUBLIC_SITE_URL}/api/sheets/revalidate` con header `X-Secret: ${SHEETS_REVALIDATE_SECRET}` y body `{ sheet: 'courts' | 'matches' | … }`.
4. Route handler valida el secret y llama `revalidateTag(tag)`.
5. Próxima lectura de esa hoja se sirve fresca.

## 11. Estado del proyecto

**Fase 0 — Bootstrap** (en curso). Checklist completo en `docs/PLAN.md` §8.

Cuando termines una fase, marca los checkboxes en `docs/PLAN.md` y actualiza el encabezado `Estado`.

## 12. Cómo trabajar en este repo

1. **Lee `docs/PLAN.md` entero** antes de tocar código.
2. **Lee este `AGENTS.md`** para no romper convenciones.
3. **Carga `vercel-react-best-practices`** si vas a escribir componentes React/Next.js.
4. **Branching**: feature branches desde `develop`; PRs a `develop`. `main` solo por merges desde `develop` ya verificados.
5. **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
6. **Antes de commitear**: `npm run lint` y `npm run typecheck`. Si agregaste test E2E, `npm run test:e2e`.
