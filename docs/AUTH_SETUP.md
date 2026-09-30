# Auth.js (NextAuth v5) — Setup

> **Resultado esperado**: login con Google funcionando, sesión en JWT cookie httpOnly, promoción automática a admin para emails en `ALLOWED_ADMIN_EMAILS`, middleware que protege `/cuenta/*` y `/admin/*`.

## 1. Dependencias

Se agregan en Fase 2 cuando se implemente, pero conviene conocerlas desde ya:

```bash
npm install next-auth@beta
npm install --save-dev @auth/core
```

`next-auth@beta` es la línea de Auth.js v5. La API cambió bastante respecto a v4 — todo va en `lib/auth/config.ts`.

## 2. Variables de entorno

Verificar que estén en `.env.local`:

```bash
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_GOOGLE_ID=                 # de docs/GOOGLE_CLOUD_SETUP.md §5
AUTH_GOOGLE_SECRET=             # de docs/GOOGLE_CLOUD_SETUP.md §5
AUTH_TRUST_HOST=true            # solo en dev
ALLOWED_ADMIN_EMAILS=admin@canchaabierta.cl,otro.admin@gmail.com
```

- `AUTH_SECRET`: clave usada para firmar los JWT. **Rotar compromete todas las sesiones** (los usuarios deben re-login). Generar con `openssl rand -base64 32`
- `AUTH_TRUST_HOST=true`: necesario en dev cuando `NEXT_PUBLIC_SITE_URL` es `http://localhost:3000`. En Vercel no hace falta porque infiere el host del deployment
- `ALLOWED_ADMIN_EMAILS`: comma-separated, lowercase, sin espacios. El helper `isAdminEmail()` en `lib/auth/admins.ts` ya lo lee

## 3. Configuración de Auth.js (referencia para Fase 2)

> Esta sección documenta el diseño. **No está implementado todavía** — se hace en Fase 2.

### `lib/auth/config.ts`

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/auth/admins";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.isAdmin = isAdminEmail(user.email);
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
```

### Tipos extendidos de la sesión

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
    };
  }
}
```

### `app/api/auth/[...nextauth]/route.ts`

```typescript
export { GET, POST } from "@/lib/auth/config";
```

### `middleware.ts` (raíz del proyecto)

```typescript
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth);
  const isAdmin = Boolean(req.auth?.user?.isAdmin);

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  if (pathname.startsWith("/cuenta") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*"],
};
```

### `lib/auth/admins.ts` (ya existe)

```typescript
export function getAllowedAdminEmails(): string[] {
  const raw = process.env.ALLOWED_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized.length === 0) return false;
  return getAllowedAdminEmails().includes(normalized);
}
```

## 4. Flujo de login

1. Usuario va a `/auth/signin` (página pública con botón "Continuar con Google")
2. Click → redirige a Google OAuth consent screen
3. Google valida que el email esté en la lista de "usuarios de prueba" (mientras la app esté en modo Testing en GCP) o que sea público (si la app está En producción)
4. Google redirige a `/api/auth/callback/google?code=...`
5. Auth.js intercambia el `code` por un `access_token`, obtiene el perfil, llama al callback `jwt`
6. El callback `jwt` chequea `isAdminEmail(email)` y setea `token.isAdmin`
7. Se setea la cookie `next-auth.session-token` (httpOnly, secure en prod)
8. Redirección al home o al `callbackUrl` original

## 5. Cómo probar el admin allowlist

1. Asegurarse de que `ALLOWED_ADMIN_EMAILS=tu-email@gmail.com` en `.env.local`
2. Login con ese email
3. Inspeccionar la cookie `next-auth.session-token` en DevTools → Application → Cookies
4. Decodear el JWT (https://jwt.io) y verificar que el payload incluya `"isAdmin": true`
5. Intentar acceder a `/admin/canchas` → debería renderizar
6. Logout y login con otro email **no** listado → debería redirigir a `/auth/signin`

## 6. Verificación de la pantalla de consentimiento

Mientras la app esté en modo **Testing** en GCP:

1. Agregar tu email en **Usuarios de prueba** (ver [GOOGLE_CLOUD_SETUP.md §4](./GOOGLE_CLOUD_SETUP.md))
2. Cualquier otro email que intente login verá "App is not verified" y no podrá avanzar

Cuando estés listo para producción:

1. En GCP, ir a **Pantalla de consentimiento de OAuth** → **Publicar la app**
2. Si solo pides scopes básicos (`email`, `profile`, `openid`), Google aprueba automáticamente
3. Si pides scopes sensibles (Drive, Calendar, etc.), Google requiere revisión manual (días/semanas)

## 7. Troubleshooting

| Problema | Causa | Solución |
|---|---|---|
| `redirect_uri_mismatch` | La URI de callback no está autorizada en GCP | Revisar `docs/GOOGLE_CLOUD_SETUP.md` §5 |
| `Access blocked: This app's request is invalid` | Scopes mal configurados en GCP o Auth.js | Comparar con §3 de este doc |
| `MissingCSRF` | Cookie de sesión corrupta o `AUTH_SECRET` cambió | Borrar cookies del navegador |
| `JWT_SESSION_ERROR` | El `AUTH_SECRET` no coincide entre deploys | Confirmar que las env vars de Vercel coincidan con `.env.local` |
| `isAdmin` siempre `false` aunque el email está en la lista | `ALLOWED_ADMIN_EMAILS` mal parseada | Verificar que sean emails **separados por coma sin espacios** |
| Login funciona pero `req.auth` es `undefined` en middleware | `middleware.ts` mal importado o matcher mal configurado | Verificar que `export default auth(...)` y que el `matcher` cubra la ruta |

## 8. Próximos pasos (Fase 2)

1. Instalar `next-auth@beta` y agregar a `package.json`
2. Implementar `lib/auth/config.ts` según el template de §3
3. Crear `app/api/auth/[...nextauth]/route.ts`
4. Crear `app/(public)/auth/signin/page.tsx` con botón Google
5. Crear `middleware.ts` en la raíz
6. Crear `app/(account)/cuenta/perfil/page.tsx` (formulario de perfil + server action `updateProfile`)
7. Smoke test E2E: login → completar perfil → logout → re-login (perfil debe persistir en Sheets)

## Próximo paso

Ir a [docs/DEPLOY.md](./DEPLOY.md) para deploy en Vercel.
