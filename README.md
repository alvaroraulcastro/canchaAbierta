# canchaAbierta

Plataforma web para encontrar jugadores y unirse a partidos de **pádel** y **babyfútbol** en Chile.

- **URL Sheets**: https://docs.google.com/spreadsheets/d/1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM/edit?usp=sharing
- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Auth.js v5 + Google Sheets API + Flow.cl + Resend + Vercel KV
- **Hosting**: Vercel
- **Moneda / idioma / TZ**: CLP / es-CL / `America/Santiago`

## Roles

- **Administrador**: edita canchas, partidos y puede aprobar sobrecupos. Lista cerrada de emails en `ALLOWED_ADMIN_EMAILS`.
- **Jugador**: se autentica con Google, completa su perfil, se inscribe en partidos y paga con Flow.cl.

## Quickstart local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# completar valores (ver docs/PLAN.md §7)

# 3. Levantar el dev server
npm run dev
```

Abrir http://localhost:3000.

### Requisitos previos

- Node.js 20+
- Una cuenta de Google Cloud con un proyecto que tenga habilitada la **Sheets API** y un **service account** con su JSON
- El Sheets compartido con el email del service account (permiso Editor)
- (Producción) cuenta en Flow.cl, Resend, Upstash (Vercel KV)

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción local |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright (cuando esté configurado) |

## Documentación

- **[docs/PLAN.md](./docs/PLAN.md)** — plan de implementación, arquitectura, modelo de datos, fases y riesgos
- **[AGENTS.md](./AGENTS.md)** — contexto para futuros agentes / colaboradores
- `docs/SHEETS_SCHEMA.md` — (próximamente) referencia del schema del Sheets con ejemplos de filas
- `docs/APPS_SCRIPT_SETUP.md` — (próximamente) cómo instalar el trigger de Apps Script para sync en tiempo real
- `docs/DEPLOY.md` — (próximamente) guía de deploy en Vercel y checklist de secrets

## Estructura

```
canchaAbierta/
├── app/                  # Next.js App Router
│   ├── (public)/         # landings y listados
│   ├── (account)/        # área autenticada del jugador
│   ├── (admin)/          # panel admin
│   └── api/              # route handlers (auth, flow, sheets)
├── components/           # UI
├── lib/
│   ├── sheets/           # cliente Google Sheets + repos
│   ├── auth/             # Auth.js + admins
│   ├── flow/             # pagos
│   ├── email/            # Resend + templates
│   └── locks/            # Vercel KV distributed lock
├── emails/               # React Email templates
├── docs/                 # PLAN.md y guías
├── tests/e2e/            # Playwright
└── types/
```

## Estado del proyecto

**Fase 0 — Bootstrap** (en curso). Ver checklist detallado en `docs/PLAN.md` §8.
