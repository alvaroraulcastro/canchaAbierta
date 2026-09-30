# Resend — Setup paso a paso

> **Resultado esperado**: cuenta Resend con un dominio verificado, una API key y el remitente `no-reply@canchaabierta.cl` listo para enviar.

## 1. Crear cuenta

1. Ir a https://resend.com/
2. Sign up con email (o GitHub/Google)
3. Plan gratuito: **100 emails/día** y **3,000/mes** sin tarjeta. Suficiente para empezar.

## 2. Verificar dominio

Para enviar desde `noreply@tudominio.cl` en vez de `onboarding@resend.dev` (que es el default mientras no haya dominio), hay que verificar el dominio.

1. En el panel, ir a **Domains** → **Add Domain**
2. Ingresar `canchaabierta.cl` (o el subdominio que vayas a usar)
3. Resend te muestra registros DNS a agregar:
   - **DKIM** (TXT)
   - **SPF** (TXT)
   - **DMARC** (TXT, opcional pero recomendado)
4. Ir al panel de tu proveedor de DNS (Cloudflare, Route53, NIC Chile, etc.) y agregar los registros tal cual
5. Volver a Resend y click **Verify**. La propagación DNS puede tardar hasta 48h pero normalmente es inmediata.

### Si estás en dev local

Puedes usar el dominio `onboarding@resend.dev` que viene por defecto y enviar solo a tu email personal. Útil para no tener que configurar DNS durante el desarrollo.

Para activar eso, no agregues dominio y simplemente usa `RESEND_FROM_EMAIL=onboarding@resend.dev` en `.env.local`.

## 3. Crear API Key

1. **API Keys** → **Create API Key**
2. Nombre: `canchaAbierta - dev` (o `prod`)
3. Permisos: **Sending access** (no necesita Full access)
4. Dominio: dejarlo en "All domains" o restringir al tuyo
5. Click **Create**
6. ⚠ La key se muestra **una sola vez**. Copiarla inmediatamente.

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@canchaabierta.cl
```

> En producción conviene crear **dos keys separadas**: una para dev con un dominio y otra para prod. Si la key de dev se filtra, no afecta a prod.

## 4. Variables de entorno

En `.env.local` (y Vercel):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@canchaabierta.cl
```

## 5. Verificación

Una vez que la Fase 2 implemente el envío de emails, se puede probar con:

```bash
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{ "to": "tu-email@gmail.com", "subject": "Test", "text": "Hola desde canchaAbierta" }'
```

El endpoint debe desaparecer antes de producción. La verificación de "todo bien" es: el email llega a la bandeja (revisar spam).

## 6. Templates de email

Los templates viven en `emails/` y se renderizan con **React Email** (`@react-email/components`). Esto se instala en Fase 2.

Plantillas planeadas:

| Template | Cuándo se envía |
|---|---|
| `inscription-confirmed.tsx` | Tras confirmar pago en Flow |
| `payment-received.tsx` | Inmediato al webhook |
| `match-cancelled.tsx` | Cuando admin cancela el partido |
| `match-reminder.tsx` | 24h antes del partido |
| `overbook-pending.tsx` | Al admin cuando hay un sobrecupo por aprobar |
| `overbook-approved.tsx` / `overbook-rejected.tsx` | Cuando admin decide |

Todos los templates deben:

- Estar en **español chileno**
- Incluir link a la canchaAbierta
- Usar el logo y la paleta de marca
- Ser responsive (la mayoría se lee en móvil)

## 7. Troubleshooting

| Problema | Causa | Solución |
|---|---|---|
| `403 API key invalid` | Key mal copiada o revocada | Regenerar en panel |
| `403 Domain not verified` | DNS no propagado o dominio mal escrito | Revisar registros DNS |
| Email llega a spam | Falta SPF/DKIM/DMARC | Verificar que los 3 registros estén correctos en DNS |
| Email no llega | `RESEND_FROM_EMAIL` no coincide con dominio verificado | Usar una dirección que pertenezca al dominio verificado |
| `Rate limit exceeded` | Más de 100 emails/día en plan free | Esperar al día siguiente o upgrade plan |

## 8. Buenas prácticas

- **No enviar emails transaccionales con archivos adjuntos pesados**; usar links a PDFs generados on-demand
- **Idempotencia**: si el webhook de Flow se dispara dos veces, el envío de email también. El backend debe deduplicar por `inscriptionId` en KV antes de enviar
- **Modo dev vs prod**: usar dos API keys para evitar que un dev con acceso a la de prod rompa algo
- **Bounce handling**: configurar el webhook de Resend para que los bounces se registren como `read=false` en la hoja `Notificaciones` y el admin los vea

## Próximo paso

Ir a [docs/AUTH_SETUP.md](./AUTH_SETUP.md) para configurar Auth.js.
