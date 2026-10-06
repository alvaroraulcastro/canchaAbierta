# Plan de implementación — canchaAbierta

> Estado: **Fase 1 — Lectura pública** (código ✅; setup externo de Fase 0 pendiente) · Última actualización: 2026-10-05

## 0. Índice de documentos

| Doc | Propósito |
|---|---|
| **[PLAN.md](./PLAN.md)** | Este archivo. Arquitectura, modelo de datos, fases y riesgos |
| **[README.md](../README.md)** | Quickstart local y resumen del proyecto |
| **[AGENTS.md](../AGENTS.md)** | Contexto para futuros agentes / colaboradores |
| **[GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)** | Crear proyecto GCP, habilitar Sheets API, crear service account y credenciales OAuth |
| **[SHEETS_SCHEMA.md](./SHEETS_SCHEMA.md)** | Headers exactos de las 7 hojas + filas de ejemplo + script de bootstrap |
| **[APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md)** | Instalar el trigger `onChange` que sincroniza el Sheets con Next.js |
| **[FLOW_CL_SETUP.md](./FLOW_CL_SETUP.md)** | Cuenta Flow.cl, API keys, sandbox vs producción, contrato API |
| **[RESEND_SETUP.md](./RESEND_SETUP.md)** | Verificar dominio, crear API key, remitente |
| **[AUTH_SETUP.md](./AUTH_SETUP.md)** | Auth.js v5 con Google provider + admin allowlist |
| **[DEPLOY.md](./DEPLOY.md)** | Deploy en Vercel, env vars, KV, dominio custom |
| **[scripts/bootstrap-sheets.mjs](./scripts/bootstrap-sheets.mjs) | Script Node para crear las 7 hojas vía API |
| **[scripts/apps-script.gs](./scripts/apps-script.gs)** | Código del trigger Apps Script para copiar/pegar |

## 1. Resumen ejecutivo

**canchaAbierta** es una plataforma web para encontrar jugadores y unirse a partidos de **pádel** y **babyfútbol** en Chile. Los datos viven en un **Google Sheets** (fuente única de verdad) que el administrador edita directamente o a través de un panel admin. Los jugadores se autentican con **Google**, completan su perfil, eligen un partido y pagan con **Flow.cl (Transbank Webpay REST)** para confirmar su inscripción. Se permite **sobrecupo** con confirmación manual del admin.

- **Hosting**: Vercel
- **Repo**: GitHub (branch principal `main`, develop activo)
- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Auth.js v5 + Google Sheets API + Flow.cl + Resend + Vercel KV
- **Moneda / idioma / TZ**: CLP / es-CL / `America/Santiago`

## 2. Recursos compartidos

| Recurso | Valor |
|---|---|
| Google Sheets ID | `1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM` |
| URL Sheets | https://docs.google.com/spreadsheets/d/1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM/edit?usp=sharing |
| Sheets (estado actual) | Una hoja "Hoja 1" sin contenido; **aún no se han creado las 7 hojas del §5** |
| Owner del Sheets | TBD (owner de la cuenta Google del admin) |
| Service account email | TBD (se crea en [GOOGLE_CLOUD_SETUP.md §6](./GOOGLE_CLOUD_SETUP.md)) |
| Proyecto GCP | TBD (`cancha-abierta` recomendado) |
| Cuenta Vercel | TBD (vinculada a este repo) |
| Cuenta Flow.cl | TBD (sandbox + producción) |
| Dominio Resend | TBD (puede ser `onboarding@resend.dev` en dev) |
| Bucket Vercel KV | TBD (`cancha-abierta-kv`) |

## 2.1 Setup paso a paso (orden recomendado)

Ejecutar en este orden para llegar de cero a "app deployada en Vercel":

1. **[GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)** — crear proyecto, habilitar Sheets API, crear service account, crear OAuth client. Sin esto nada funciona.
2. **[SHEETS_SCHEMA.md](./SHEETS_SCHEMA.md)** — crear las 7 hojas en el workbook (manual o con `docs/scripts/bootstrap-sheets.mjs`).
3. Compartir el Sheets con el email del service account (Volver a [GOOGLE_CLOUD_SETUP.md §7](./GOOGLE_CLOUD_SETUP.md)).
4. **[APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md)** — instalar el trigger `onChange` para sync en tiempo real.
5. **[AUTH_SETUP.md](./AUTH_SETUP.md)** — preparar config de Auth.js (se implementa en Fase 2 pero las env vars ya están listas).
6. **[FLOW_CL_SETUP.md](./FLOW_CL_SETUP.md)** — crear cuenta, obtener API keys de sandbox.
7. **[RESEND_SETUP.md](./RESEND_SETUP.md)** — crear cuenta, verificar dominio (o usar `onboarding@resend.dev` en dev).
8. **[DEPLOY.md](./DEPLOY.md)** — conectar repo a Vercel, configurar env vars, provisionar KV, deploy.

## 2.2 Cuentas externas requeridas (checklist)

| Servicio | Para | Costo aprox. | Crear |
|---|---|---|---|
| Google Cloud | Sheets API + OAuth | Gratis hasta volumen alto | https://console.cloud.google.com/ |
| Vercel | Hosting + KV | Hobby plan gratis; Pro desde USD 20/mes | https://vercel.com/signup |
| Flow.cl | Pagos | Comisión por transacción + fijo mensual según plan | https://www.flow.cl/ |
| Resend | Emails | 100/día gratis; luego planes | https://resend.com/signup |
| Upstash (Vercel KV) | Locks + idempotencia | Tier free generoso | Provisionado desde Vercel |
| Dominio propio (ej. `canchaabierta.cl`) | Producción | ~CLP 10.000/año | NIC Chile u otro registrar |

## 2.3 Variables de entorno (resumen)

Ver archivo `.env.example` para la lista completa y descripciones inline. **17 variables** agrupadas:

| Grupo | Variables |
|---|---|
| Next.js | `NEXT_PUBLIC_SITE_URL` |
| Auth.js | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| Admin | `ALLOWED_ADMIN_EMAILS` |
| Sheets | `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` |
| Apps Script | `SHEETS_REVALIDATE_SECRET` |
| Flow.cl | `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_BASE_URL`, `FLOW_WEBHOOK_URL` |
| Resend | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Vercel KV | `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` |

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript estricto |
| Estilos | Tailwind CSS + shadcn/ui |
| Auth | Auth.js v5 (NextAuth) — Google provider |
| Data | Google Sheets API (`googleapis`) + service account |
| Sync Sheets ↔ app | Apps Script trigger `onChange` → POST `/api/sheets/revalidate` → `revalidateTag` |
| Pagos | Flow.cl (Transbank Webpay REST) |
| Emails | Resend + React Email |
| Lock + idempotencia | Vercel KV (Upstash Redis) |
| Zona horaria | `date-fns-tz` con `America/Santiago` |
| Validación | Zod |
| Tests E2E | Playwright |

## 4. Modelo de datos (Google Sheets)

Un workbook con **7 hojas**. Los IDs de columna son referenciales; la fila 1 es encabezado.

### `Venues` (complejos deportivos)
| # | Columna | Tipo | Notas |
|---|---|---|---|
| A | id | string (slug) | PK |
| B | name | string | |
| C | address | string | |
| D | lat | number | |
| E | lng | number | |
| F | contactPhone | string | |
| G | photoUrl | string | |
| H | active | boolean | `TRUE`/`FALSE` |

### `Canchas` (courts)
| # | Columna | Tipo | Notas |
|---|---|---|---|
| A | id | string | PK |
| B | venueId | string | FK → Venues.id |
| C | name | string | "Cancha 1", "Cancha central" |
| D | sport | enum | `padel` \| `babyfutbol` |
| E | capacity | number | 4 (pádel) / 10 (babyfútbol) |
| F | priceCLP | number | precio variable definido por admin |
| G | photoUrl | string | |
| H | active | boolean | |

### `Partidos` (matches)
| # | Columna | Tipo | Notas |
|---|---|---|---|
| A | id | string (uuid) | PK |
| B | courtId | string | FK → Canchas.id |
| C | dateTime | string ISO 8601 | siempre en `America/Santiago` |
| D | durationMin | number | default 90 |
| E | maxPlayers | number | |
| F | currentPlayers | number | denormalizado; lo actualiza el webhook de pago |
| G | allowOverbook | boolean | si permite más allá de `maxPlayers` |
| H | requiresExtraConfirmation | boolean | true si hay sobrecupo pendiente de aprobar |
| I | status | enum | `open` \| `closed` \| `cancelled` \| `completed` |
| J | createdBy | string | email del admin |
| K | createdAt | string ISO | |

### `Jugadores` (players)
| # | Columna | Tipo | Notas |
|---|---|---|---|
| A | email | string | PK (viene de Google OAuth) |
| B | name | string | |
| C | phone | string | formato `+56 9 ...` |
| D | level | enum | `principiante` \| `intermedio` \| `avanzado` |
| E | preferredPosition | string | arquero / defensa / mediocampista / delantero |
| F | createdAt | string ISO | |

### `Inscripciones` (registrations)
| # | Columna | Tipo | Notas |
|---|---|---|---|
| A | id | string (uuid) | PK |
| B | matchId | string | FK → Partidos.id |
| C | playerEmail | string | FK → Jugadores.email |
| D | amountCLP | number | snapshot del precio al inscribirse |
| E | paymentStatus | enum | `pending` \| `paid` \| `failed` \| `refunded` \| `cancelled` |
| F | flowToken | string | id de intención en Flow |
| G | flowOrderId | string | orden interna nuestra |
| H | overbookRequested | boolean | true si pasó el cupo y `allowOverbook` está activo |
| I | adminApproved | boolean | `TRUE` si admin aprobó sobrecupo; `FALSE` si rechazó; vacío si no aplica |
| J | createdAt | string ISO | |
| K | updatedAt | string ISO | |

### `Notificaciones`
| # | Columna | Tipo | Notas |
|---|---|---|---|
| A | id | string | PK |
| B | recipientEmail | string | |
| C | type | enum | `inscription_confirmed`, `payment_received`, `match_cancelled`, `overbook_pending`, `overbook_approved`, `match_reminder` |
| D | title | string | |
| E | body | string | |
| F | link | string | ruta interna (ej. `/cuenta/inscripciones/<id>`) |
| G | read | boolean | |
| H | createdAt | string ISO | |

### `AdminAudit`
| # | Columna | Tipo | Notas |
|---|---|---|---|
| A | timestamp | string ISO | |
| B | adminEmail | string | |
| C | action | enum | `create` \| `update` \| `delete` |
| D | entity | string | `venue` \| `court` \| `match` \| `inscription` |
| E | entityId | string | |
| F | before | string JSON | (vacío si es create) |
| G | after | string JSON | (vacío si es delete) |

## 5. Arquitectura

```
[Admin]  ──edita──▶ [Google Sheets] ──onChange──▶ [Apps Script]
                                                    │
                                                    ▼ POST /api/sheets/revalidate (X-Secret)
                                                    │
[Player] ──login──▶ [Next.js (Vercel)] ◀──revalidateTag──┘
   │                       │
   │                       ├── lee Sheets (cached, tag-based)
   │                       ├── Server Actions (admin CRUD)
   │                       ├── crea intención de pago ──▶ [Flow.cl]
   │                       │                                │
   │   ◀── redirect ───────┤                                │
   │                       │                                │
   │                       ◀── webhook firmado ─────────────┘
   │                       │
   │                       ├── verifica firma + dedupe en KV
   │                       ├── marca Inscripción pagada
   │                       ├── libera lock KV del match
   │                       ├── envía email (Resend)
   │                       └── escribe Notificación in-app
```

### Routing

- `app/(public)/*` — landings, listados, detalle cancha/partido, sign-in
- `app/(account)/*` — perfil, mis inscripciones, notificaciones (sesión requerida)
- `app/(admin)/*` — panel admin (middleware chequea `email ∈ ALLOWED_ADMIN_EMAILS`)
- `app/api/auth/[...nextauth]/route.ts` — Auth.js
- `app/api/flow/webhook/route.ts` — confirmación de pago
- `app/api/sheets/revalidate/route.ts` — Apps Script → `revalidateTag`

### Server vs Client

- **Server Components** por defecto para listados, detalle y panel admin
- **Client Components** solo donde se necesita estado: formularios (React Hook Form), dropdowns interactivos
- **Server Actions** para mutaciones del admin y del jugador (inscripción)
- **`revalidateTag`** etiquetando reads por hoja: `tag='venues'`, `tag='courts'`, `tag='matches'`, `tag='matches:<id>'`, `tag='inscriptions:<matchId>'`

## 6. Estructura de carpetas objetivo

```
canchaAbierta/
├── app/
│   ├── (public)/                 # landings, listados, detalle cancha/partido, auth
│   ├── (account)/                # perfil, mis inscripciones, notificaciones
│   ├── (admin)/                  # panel admin
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js
│   │   ├── flow/webhook/         # confirmación de pago
│   │   └── sheets/revalidate/    # Apps Script → revalidateTag
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── courts/
│   ├── matches/
│   ├── inscriptions/
│   └── notifications/
├── lib/
│   ├── sheets/
│   │   ├── client.ts             # googleapis + JWT auth
│   │   ├── repos/{venues,courts,matches,inscriptions,players,notifications,audit}.ts
│   │   └── schemas.ts            # Zod schemas espejo del Sheets
│   ├── auth/
│   │   ├── config.ts             # NextAuth (Auth.js v5)
│   │   └── admins.ts             # isAdminEmail() ✅ implementado
│   ├── flow/
│   │   ├── client.ts             # crear intención, confirmar
│   │   └── verify-signature.ts
│   ├── email/
│   │   ├── client.ts             # Resend
│   │   └── templates/            # React Email
│   ├── locks/
│   │   └── match-lock.ts         # KV distributed lock
│   └── time.ts                   # America/Santiago helpers ✅ implementado
├── emails/                       # React Email templates
├── types/
├── tests/e2e/                    # Playwright
├── docs/
│   ├── PLAN.md                   # este archivo
│   ├── GOOGLE_CLOUD_SETUP.md
│   ├── SHEETS_SCHEMA.md
│   ├── APPS_SCRIPT_SETUP.md
│   ├── FLOW_CL_SETUP.md
│   ├── RESEND_SETUP.md
│   ├── AUTH_SETUP.md
│   ├── DEPLOY.md
│   └── scripts/
│       ├── bootstrap-sheets.mjs  # crear las 7 hojas vía API
│       └── apps-script.gs        # código del trigger Apps Script
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── README.md
├── AGENTS.md
└── package.json
```

## 7. Variables de entorno

> Resumen en §2.3. La lista canónica con descripciones está en `.env.example` (raíz del repo).

## 8. Fases de implementación

### Fase 0 — Bootstrap
**Setup externo** (sigue los docs en este orden):
- [ ] **[GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)** — crear proyecto, habilitar Sheets API, crear service account + JSON key, crear OAuth client
- [ ] **[SHEETS_SCHEMA.md](./SHEETS_SCHEMA.md)** — crear las 7 hojas (manual o con `docs/scripts/bootstrap-sheets.mjs`)
- [ ] Compartir el Sheets con el email del service account
- [ ] **[APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md)** — instalar el trigger `onChange`
- [ ] **[AUTH_SETUP.md](./AUTH_SETUP.md)** — preparar env vars de Auth.js (la integración completa es Fase 2)
- [ ] **[FLOW_CL_SETUP.md](./FLOW_CL_SETUP.md)** — crear cuenta, obtener API keys sandbox
- [ ] **[RESEND_SETUP.md](./RESEND_SETUP.md)** — crear cuenta, verificar dominio
- [ ] **[DEPLOY.md](./DEPLOY.md)** — conectar repo a Vercel, configurar env vars, provisionar KV

**Setup de código**:
- [x] `npx create-next-app@latest` con TS + Tailwind + App Router + ESLint (scaffold manual)
- [x] Configurar Prettier y alias `@/`
- [x] `tsconfig.json` con `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`
- [x] `lib/time.ts` con helpers `America/Santiago`
- [x] `lib/auth/admins.ts` con `isAdminEmail()`
- [x] `.env.example` con todas las variables documentadas
- [ ] Conectar repo a Vercel, branch protection en `main`
- [x] Documentación inicial: `README.md`, `AGENTS.md`, `docs/PLAN.md`, `docs/*.md`

### Fase 1 — Lectura pública
- [x] `lib/sheets/client.ts` (auth googleapis) + `lib/sheets/repos/*.ts` con Zod schemas
- [x] `app/(public)/canchas/page.tsx` — listado con filtros (server-side via searchParams)
- [x] `app/(public)/canchas/[id]/page.tsx` — detalle
- [x] `app/(public)/partidos/page.tsx` — listado
- [x] `app/(public)/partidos/[id]/page.tsx` — detalle con cupos y precio
- [x] `app/api/sheets/revalidate/route.ts` — recibe POST de Apps Script, valida secret, llama `revalidateTag`
- [x] `revalidateTag` por hoja
- [x] ISR de respaldo (`revalidate = 60`) por si falla el webhook
- [x] shadcn/ui inicial + componentes base (Button, Card, Input, Badge)

### Fase 2 — Registro e inscripción
- [ ] `lib/auth/config.ts` — NextAuth v5 con Google provider, callbacks `jwt`/`session` para inyectar `isAdmin`
- [ ] `app/api/auth/[...nextauth]/route.ts`
- [ ] `app/(public)/auth/signin/page.tsx`
- [ ] `middleware.ts` que protege `/admin/*` (admin only) y `/cuenta/*` (logged-in)
- [ ] `/cuenta/perfil` — React Hook Form + Zod, completa datos faltantes
- [ ] Server action `updateProfile`
- [ ] `lib/locks/match-lock.ts` — lock distribuido en KV por `matchId`
- [ ] `lib/flow/client.ts` — crear intención de pago (firmar params con `FLOW_SECRET_KEY`)
- [ ] `lib/flow/verify-signature.ts` — validar firma de webhooks
- [ ] Server action `inscribirse(matchId)`:
  1. lock distribuido en KV por `matchId`
  2. leer Partidos + contar Inscripciones pagadas
  3. si lleno y `!allowOverbook` → rechazar
  4. si lleno y `allowOverbook` → crear inscripción con `overbookRequested=true`
  5. crear intención en Flow con `commerceOrder`
  6. escribir Inscripción `pending` en Sheets
  7. devolver `redirectUrl` de Flow
- [ ] `app/api/flow/webhook/route.ts`:
  1. verificar firma
  2. dedupe por `token` en KV (TTL 24h)
  3. actualizar Inscripción a `paid`, incrementar `currentPlayers` en Partidos
  4. si fue sobrecupo → notificar admin
  5. email al jugador + Notificación in-app
- [ ] `emails/inscription-confirmed.tsx` (React Email)
- [ ] Página `/cuenta/mis-inscripciones`
- [ ] Página `/cuenta/notificaciones` (in-app)

### Fase 3 — Panel admin
- [ ] CRUD canchas (Server Actions): create/update/delete con `revalidateTag('courts')` + auditoría
- [ ] CRUD partidos: misma idea + manejo de `allowOverbook` y `requiresExtraConfirmation`
- [ ] Vista de inscripciones por partido: aprobar/rechazar sobrecupo, marcar asistencia
- [ ] Botón "cerrar partido" / "cancelar partido" con notificación masiva
- [ ] `AdminAudit` se escribe en cada mutación (helper en `lib/sheets/repos/audit.ts`)
- [ ] Listado de jugadores y notificaciones (read-only para empezar)

### Fase 4 — Endurecimiento
- [ ] Validaciones Zod en todos los inputs (incluidos `searchParams`)
- [ ] Manejo de errores con `error.tsx` y `not-found.tsx` por segmento
- [ ] Logging estructurado (sin secretos)
- [ ] Tests E2E Playwright: flujo crítico de inscripción + pago (mockeando Flow)
- [ ] Accesibilidad: revisar contraste, navegación por teclado, aria labels
- [ ] Pasaje a producción de Flow.cl (sandbox → prod)
- [ ] Verificación de Google OAuth para producción (pantalla de consentimiento)

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Concurrencia en Sheets** (no hay transacciones) | Lock distribuido en Vercel KV por `matchId` antes de inscribir; idempotency-key de Flow en KV |
| **Cuota Sheets API** (60/min/user, 300/min/project) | Cache agresivo con tags; backoff exponencial; logging de cuota |
| **Webhook perdido de Flow** | Página "mis inscripciones" consulta Flow directamente si el estado quedó `pending` > 5 min |
| **Schema drift** (admin edita columnas) | Zod valida cada read; `docs/SHEETS_SCHEMA.md` como contrato |
| **Admin compromete secret** | `ALLOWED_ADMIN_EMAILS` editable solo por redeploy; sin UI de auto-promoción |
| **Email rebota** | Logs de Resend + reintento; UI muestra advertencia en mis inscripciones |
| **Duplicado de webhook de Flow** | Dedupe en KV por `token` con TTL 24h antes de mutar Sheets |
| **Persona no-admin intenta acceder a `/admin/*`** | `middleware.ts` chequea `isAdmin` desde JWT; redirige a `/auth/signin` |
| **Service account key filtrada** | Rotar la key en GCP (invalidar la anterior) + redeploy con nueva env var |
| **Cambio en API de Flow** | Encapsular en `lib/flow/client.ts`; tests E2E detectan regresiones |

## 10. Convenciones del proyecto

- **TypeScript estricto** (`strict: true`, `noUncheckedIndexedAccess: true`)
- **Server Components por defecto**; usar `'use client'` solo cuando hace falta estado/efectos
- **No barrel imports** que importen módulos grandes sin necesidad (ver regla `bundle-barrel-imports` de `vercel-react-best-practices`)
- **Sin DB tradicional**: no usar Prisma/Drizzle. Toda la persistencia es Sheets + KV para locks/idempotencia
- **No commitear secrets**: solo `.env.example` se commitea; `.env*.local` ignorado
- **Branching**: `main` (producción) y `develop` (integración). PRs de feature a `develop`
- **Conventional Commits** para mensajes (`feat:`, `fix:`, `chore:`, `docs:`)
- **No añadir comentarios** salvo que el usuario lo pida explícitamente

## 11. Matriz de permisos (resumen)

| Acción | Visitante (sin login) | Jugador | Admin |
|---|---|---|---|
| Ver `/`, `/canchas`, `/partidos`, `/canchas/[id]`, `/partidos/[id]` | ✅ | ✅ | ✅ |
| Iniciar sesión con Google | ✅ | n/a | n/a |
| Acceder a `/cuenta/*` | ❌ redirect a `/auth/signin` | ✅ | ✅ |
| Inscribirse a un partido (con pago) | ❌ | ✅ | ✅ |
| Ver sus propias inscripciones | ❌ | ✅ | ✅ |
| Cancelar su propia inscripción | ❌ | ✅ (si `paymentStatus=paid` y la cancelación está dentro de la política) | ✅ |
| Acceder a `/admin/*` | ❌ | ❌ | ✅ |
| Crear/editar/eliminar canchas | ❌ | ❌ | ✅ |
| Crear/editar/eliminar partidos | ❌ | ❌ | ✅ |
| Aprobar/rechazar sobrecupos | ❌ | ❌ | ✅ |
| Marcar asistencia | ❌ | ❌ | ✅ |
| Ver audit log | ❌ | ❌ | ✅ |
| Ver listado global de jugadores | ❌ | ❌ | ✅ |

> La promoción a admin ocurre **automáticamente** en el callback `jwt` de Auth.js si el email del usuario está en `ALLOWED_ADMIN_EMAILS`. No hay UI para promover usuarios.

## 12. Testing

### Unit / integration

- **Repos de Sheets**: mockear `googleapis` y validar que cada repo aplica correctamente el Zod schema, normaliza booleanos (`TRUE`/`true`), maneja sheets vacíos y errores 404/403.
- **Server actions**: tests aislados con inputs válidos e inválidos; verificar el return shape `{ ok: true, data } | { ok: false, error }`.
- **Locks**: tests que simulan concurrencia para validar que dos requests simultáneos al mismo `matchId` no producen doble inscripción.

### E2E (Playwright)

Casos críticos a cubrir:

1. **Sign in con Google** → redirige a home con sesión activa
2. **Completar perfil de jugador** → persiste en hoja `Jugadores`
3. **Listado de partidos** → muestra partidos reales desde Sheets
4. **Inscripción exitosa** (con Flow mockeado) → inscripción en `paid`, email enviado (mock), `currentPlayers++`
5. **Inscripción con sobrecupo** → inscripción queda con `overbookRequested=true`, admin recibe notificación
6. **Admin aprueba sobrecupo** → inscripción `adminApproved=TRUE`, jugador recibe email
7. **Admin cancela partido** → todos los jugadores inscritos reciben email y notificación in-app
8. **Middleware**: jugador intenta acceder a `/admin/*` → redirect a `/auth/signin`

Mockear el webhook de Flow usando `nock` o un endpoint de test que responde el shape de Flow.

### Smoke test manual pre-deploy

Después de cada deploy, ejecutar:

1. Login con un email admin
2. Crear una cancha nueva desde `/admin/canchas`
3. Crear un partido para esa cancha
4. Login en otro navegador con un email no-admin
5. Inscribirse al partido → completar pago con tarjeta de prueba de Flow
6. Verificar que en el Sheets la inscripción quedó `paid` y `currentPlayers=1`
7. En la hoja `Notificaciones` del Sheets, verificar que hay una fila nueva para el jugador

## 13. Decisiones diferidas / out of scope v1

Para mantener el MVP acotado, las siguientes funcionalidades **no** entran en v1. Se pueden evaluar post-lanzamiento:

- ❌ Notificaciones WhatsApp (se hace con WhatsApp Business API o servicios como Callbell)
- ❌ App móvil nativa
- ❌ Pagos recurrentes / abonos mensuales
- ❌ Multi-idioma (la UI es es-CL fijo)
- ❌ Multi-moneda (solo CLP)
- ❌ Sistema de ranking / ELO entre jugadores
- ❌ Comentarios y reseñas de canchas
- ❌ Integración con Google Calendar (agregar partido al calendario del jugador)
- ❌ Confirmación de asistencia por QR en la entrada
- ❌ Multi-admin con roles diferenciados (venue-admin, super-admin, soporte)
- ❌ Reportes / analytics para el admin (más allá de ver el Sheets directamente)
- ❌ Cancelación de inscripción con reembolso automático (requiere API adicional de Flow)
