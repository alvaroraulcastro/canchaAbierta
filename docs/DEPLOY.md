# Deploy en Vercel — paso a paso

> **Resultado esperado**: el sitio deployado en `https://canchaabierta.vercel.app` (o dominio custom), todas las env vars configuradas, KV provisionado, builds pasando en cada PR.

## 1. Conectar el repo

1. Ir a https://vercel.com/
2. **Add New Project**
3. **Import Git Repository** → autorizar GitHub → seleccionar `anomalyco/canchaAbierta` (o el nombre real)
4. Vercel detecta automáticamente que es Next.js

## 2. Configuración inicial

En la pantalla de configuración:

| Campo | Valor |
|---|---|
| Project Name | `cancha-abierta` |
| Framework Preset | Next.js (auto) |
| Root Directory | `./` |
| Build Command | `next build` (auto) |
| Output Directory | `.next` (auto) |
| Install Command | `npm install` (auto) |
| Node.js Version | 22.x (settings → General → Node.js Version) |

Click **Deploy** (fallará por env vars faltantes — está bien).

## 3. Configurar variables de entorno

1. Settings → **Environment Variables**
2. Agregar **una por una** desde la lista del `.env.example`. Importante: asignar el ambiente correcto (Production, Preview, Development):

| Variable | Production | Preview | Development | Notas |
|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://canchaabierta.cl` | (dejar vacío, Vercel infiere) | `http://localhost:3000` | |
| `AUTH_SECRET` | generar nuevo | igual a prod | generar para dev | |
| `AUTH_GOOGLE_ID` | mismo | mismo | mismo | OAuth app puede tener varios redirect URIs |
| `AUTH_GOOGLE_SECRET` | mismo | mismo | mismo | |
| `ALLOWED_ADMIN_EMAILS` | emails reales | tu email | tu email | |
| `GOOGLE_SHEETS_ID` | `1VsaQw...` | igual | igual | |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | email SA | igual | igual | |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | key completa con `\n` | igual | igual | Pegar tal cual con `\n` escapados |
| `SHEETS_REVALIDATE_SECRET` | un secret | igual a prod | un secret dev | |
| `FLOW_API_KEY` | (cuando aplique) | mismo | key de pruebas | |
| `FLOW_SECRET_KEY` | (cuando aplique) | mismo | key de pruebas | |
| `FLOW_BASE_URL` | `https://www.flow.cl/api` | igual | `https://sandbox.flow.cl/api` | |
| `FLOW_WEBHOOK_URL` | `https://canchaabierta.cl/api/flow/webhook` | usar preview URL | `http://localhost:3000` (con ngrok) | |
| `RESEND_API_KEY` | (cuando aplique) | mismo | key dev | |
| `RESEND_FROM_EMAIL` | `noreply@canchaabierta.cl` | mismo | `onboarding@resend.dev` | |
| `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` | (auto con KV) | (auto) | (no necesario en dev) | |

> ⚠ **Importante**: para `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, pegar el contenido completo **con los `\n` literales** (escapados). Vercel los interpreta correctamente.

### Secrets sensibles

Para los secrets especialmente sensibles (`AUTH_SECRET`, `FLOW_SECRET_KEY`, etc.) marcar la casilla **Sensitive** para que Vercel oculte su valor en los logs.

## 4. Provisionar Vercel KV

1. En el dashboard del proyecto, pestaña **Storage** → **Create Database** → **KV**
2. Nombre: `cancha-abierta-kv`
3. Plan: el gratuito sirve para empezar
4. Click **Create**
5. Vercel automáticamente agrega las env vars `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` (con scope **Production**, **Preview**, **Development**)

> En dev local, no necesitas KV. El código debe detectar la ausencia y degradarse gracefully (locks opcionales, idempotencia en memoria).

## 5. Dominio custom

1. Settings → **Domains**
2. Agregar `canchaabierta.cl` (y `www.canchaabierta.cl`)
3. Vercel te da los DNS records a agregar:
   - **Apex** (`canchaabierta.cl`): `A` record → `76.76.21.21`
   - **Subdomain** (`www`): `CNAME` → `cname.vercel-dns.com`
4. Agregar en el panel DNS del proveedor del dominio
5. Esperar propagación (minutos a horas)
6. Vercel emite un certificado SSL automáticamente

Una vez propagado:
- Actualizar `AUTH_GOOGLE_ID` redirect URIs para incluir `https://canchaabierta.cl/api/auth/callback/google` ([GOOGLE_CLOUD_SETUP.md §5](./GOOGLE_CLOUD_SETUP.md))
- Actualizar `NEXT_PUBLIC_SITE_URL` en producción
- Actualizar el dominio autorizado en la pantalla de consentimiento de Google ([GOOGLE_CLOUD_SETUP.md §4](./GOOGLE_CLOUD_SETUP.md))

## 6. Branch protection

Para que `main` solo reciba merges verificados:

1. Settings → **Git** → **Production Branch** → `main`
2. Settings → **Git** → **Ignored Build Step** → dejar por defecto
3. En GitHub: Settings → Branches → Add rule para `main`:
   - Require pull request reviews before merging: 1 aprobación
   - Require status checks to pass before merging: ✅ Vercel deployment
   - Require linear history
4. **Vercel Ignored Build Step**: en `vercel.json` o settings, configurar para que los pushes a `docs/*` no triggereen deploy (opcional)

## 7. Preview deployments

Cada PR abierto contra `develop` (o `main`) genera automáticamente una URL de preview:

- Formato: `cancha-abierta-git-feature-foo-usuario.vercel.app`
- Tiene sus propias env vars (scope **Preview**)
- Perfecto para que el equipo revise cambios sin deployar a producción
- Útil también para probar webhooks de Flow con una URL pública

## 8. Monitoreo

Una vez deployado:

1. **Logs**: pestaña **Logs** en Vercel → logs estructurados de cada request, server action y route handler
2. **Analytics**: pestaña **Analytics** → Core Web Vitals, tráfico por ruta
3. **Speed Insights**: opcional, para métricas reales de usuario
4. **Error tracking**: integrar Sentry (Fase 4) — `@sentry/nextjs`

## 9. Checklist pre-producción

Antes de hacer el primer deploy a producción:

- [ ] Todas las env vars de production configuradas
- [ ] KV provisionado y vinculado al proyecto
- [ ] Dominio custom configurado y SSL activo
- [ ] `GOOGLE_SHEETS_ID` correcto y service account con acceso Editor
- [ ] Apps Script instalado con `NEXT_PUBLIC_SITE_URL` apuntando al dominio real
- [ ] Flow en producción (no sandbox) con webhook apuntando al dominio real
- [ ] Resend con dominio verificado
- [ ] `ALLOWED_ADMIN_EMAILS` con los emails reales de los admins
- [ ] Auth.js Google OAuth con redirect URIs del dominio real
- [ ] Al menos una smoke test E2E pasando (login + ver listado de canchas)

## 10. Troubleshooting

| Problema | Causa | Solución |
|---|---|---|
| Build falla con "Cannot find module" | Variable de entorno no disponible en build time | Si la usa `next.config.ts`, usar `process.env.X` y verificar que esté en **all environments** |
| Deploy ok pero app crashea en runtime | Variable mal escrita (typo) | Revisar logs en Vercel |
| 500 al hacer login | `AUTH_SECRET` no configurado en ese environment | Configurar en Vercel para el scope correcto |
| Webhook de Flow nunca llega | `FLOW_WEBHOOK_URL` apunta a preview caído | Verificar que el último deploy de preview esté vivo |
| `Google Sheets 403` en producción | El Sheets no está compartido con el service account | Revisar [GOOGLE_CLOUD_SETUP.md §7](./GOOGLE_CLOUD_SETUP.md) |

## Próximo paso

Volver a [docs/PLAN.md](./PLAN.md) §8 y avanzar a **Fase 1 — Lectura pública**.
