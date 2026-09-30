# Flow.cl — Setup paso a paso

> **Resultado esperado**: cuenta Flow.cl con API keys, webhook configurado para confirmar pagos y variables de entorno listas en `.env.local`.

## 1. Crear cuenta

1. Ir a https://www.flow.cl/
2. Click **Abrir cuenta** (arriba a la derecha)
3. Completar formulario con RUT, datos de la empresa o persona natural
4. Validar email + teléfono
5. El proceso KYC tarda entre 24-72 horas hábiles

> Mientras la cuenta esté en revisión, puedes usar el **ambiente sandbox** para desarrollar.

## 2. Acceder al ambiente de pruebas (sandbox)

1. Login en https://www.flow.cl/
2. Arriba a la derecha, junto al nombre de usuario, hay un switch **Producción / Pruebas**. Ponlo en **Pruebas**
3. Esto te da acceso a:
   - API key de pruebas
   - Secret key de pruebas
   - Una colección de medios de pago de prueba (tarjetas Visa/Mastercard/Redcompra ficticias)

> **Importante**: las llaves de pruebas y producción son **distintas**. Nunca mezcles.

## 3. Obtener las credenciales

1. En el panel de Flow, ir a **Desarrolladores** (o **Tus API Keys**, según la versión del panel)
2. Verás dos pares de credenciales. Por ahora usa las de **Pruebas**:
   - `apiKey` (pública, se envía en headers HTTP como `X-API-KEY`)
   - `secretKey` (secreta, se usa para firmar las peticiones)
3. Guardar:
   - `FLOW_API_KEY=<api key de pruebas>`
   - `FLOW_SECRET_KEY=<secret key de pruebas>`

## 4. Configurar el webhook

Flow llama a una URL nuestra cuando el estado de un pago cambia (pagado, rechazado, anulado).

1. En el panel de Flow, ir a **Desarrolladores** → **Webpay** → **Notificación de pagos** (o similar; el menú cambia según la versión)
2. Configurar la URL del webhook:

   ```
   https://canchaabierta.cl/api/flow/webhook
   ```

   Para desarrollo local, **Flow no puede llamar a `localhost`** directamente. Opciones:

   a. **ngrok**: levantar túnel con `ngrok http 3000` y usar la URL HTTPS que te da ngrok
   b. **Vercel preview**: cada push a una branch genera una URL pública que sí funciona con webhooks
   c. **Saltar el webhook en dev**: usar el botón "Simular pago exitoso" del panel de Flow (modo pruebas)

3. Método: **POST**
4. Guardar

> El endpoint `/api/flow/webhook` se implementa en Fase 2. Mientras tanto, Flow puede dar error 404 al intentar notificar — eso es esperado.

## 5. Variables de entorno

Agregar a `.env.local`:

```bash
FLOW_API_KEY=tu-api-key-de-pruebas
FLOW_SECRET_KEY=tu-secret-key-de-pruebas
FLOW_BASE_URL=https://www.flow.cl/api
FLOW_WEBHOOK_URL=https://canchaabierta.cl/api/flow/webhook
```

`FLOW_BASE_URL` por defecto es producción. Si estás en pruebas, puedes apuntarlo a `https://sandbox.flow.cl/api` (verifica con la doc actual de Flow).

## 6. Tarjetas de prueba

En ambiente de pruebas, Flow acepta estas tarjetas ficticias:

| Marca | Número | Vencimiento | CVV | Resultado |
|---|---|---|---|---|
| Visa | `4168 8188 4444 7111` | cualquier futuro | `123` | Aprobado |
| Mastercard | `5186 0595 5959 0568` | cualquier futuro | `123` | Aprobado |
| Redcompra | `6623 0000 0000 0019` | cualquier futuro | `123` | Aprobado |

Para forzar rechazo, usar cualquier otro número.

## 7. Contrato de la API (referencia)

Estos son los endpoints que vamos a llamar desde Next.js en Fase 2.

### Crear intención de pago

```
POST {FLOW_BASE_URL}/payment/create
Content-Type: application/x-www-form-urlencoded
```

Parámetros (form-encoded, **NO JSON**):

| Param | Tipo | Descripción |
|---|---|---|
| `apiKey` | string | `FLOW_API_KEY` |
| `commerceOrder` | string | ID único de la inscripción en canchaAbierta |
| `subject` | string | Descripción del cobro (ej. "Inscripción partido padel 30/09") |
| `amount` | number | Monto en CLP (entero) |
| `email` | string | Email del pagador |
| `paymentMethod` | number | `1` = Webpay, `2` = MercadoPago, `9` = todos |
| `urlConfirmation` | string | URL a la que Flow notifica el resultado (`FLOW_WEBHOOK_URL`) |
| `urlReturn` | string | URL a la que el usuario vuelve tras pagar |
| `optional` | string | JSON con datos extra (ej. `{"matchId": "match-001"}`) |

Todos los params se **firman** con `FLOW_SECRET_KEY` y se agregan como `s` (verificar firma en la doc oficial — el algoritmo puede cambiar).

### Respuesta exitosa

```json
{
  "flowOrder": 1700000000,
  "url": "https://www.flow.cl/webpay/pay?token=abc123...",
  "token": "abc123..."
}
```

El `token` se guarda en la hoja `Inscripciones` columna `flowToken`.

### Webhook (lo que Flow nos envía)

```
POST {FLOW_WEBHOOK_URL}
```

Body (form-encoded o JSON según versión):

```
token=abc123...&status=2&...
```

| Status | Significado |
|---|---|
| `1` | Pendiente |
| `2` | Pagado |
| `3` | Rechazado |
| `4` | Anulado |

Cuando llega `status=2`, hay que marcar la inscripción como `paid`, incrementar `currentPlayers`, enviar email, etc.

## 8. Verificación manual

Una vez que la Fase 2 implemente la creación de intención:

```bash
curl -X POST http://localhost:3000/api/test/flow \
  -H "Content-Type: application/json" \
  -d '{ "amount": 12000, "email": "test@gmail.com" }'
```

Debería devolver una URL de Flow. Pegarla en el navegador, completar el pago con la tarjeta `4168 8188 4444 7111`, y verificar que vuelve al `urlReturn` configurado.

> El endpoint `/api/test/flow` se elimina antes de pasar a producción.

## 9. Pasaje a producción

Cuando vayas a salir a producción:

1. Completar KYC en Flow
2. Cambiar el switch Producción/Pruebas a **Producción**
3. Obtener las nuevas API keys de producción
4. Actualizar variables de entorno en Vercel
5. Cambiar `FLOW_WEBHOOK_URL` a `https://canchaabierta.cl/api/flow/webhook` (sin ngrok)
6. Hacer un pago real pequeño de prueba (luego reembolsar) para verificar el end-to-end

## 10. Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| `401 Unauthorized` al llamar a Flow | `apiKey` mal copiada o de otro ambiente | Verificar en el panel que estás en Pruebas/Producción según corresponda |
| `Firma inválida` | El cálculo de la firma no coincide con la doc actual de Flow | Revisar [docs oficiales](https://www.flow.cl/docs/api.html) — el algoritmo se actualiza |
| Webhook nunca llega | URL no accesible públicamente (ej. localhost) | Usar ngrok o un deploy preview |
| Webhook llega pero la app no procesa | Endpoint `/api/flow/webhook` no implementado todavía | Normal hasta Fase 2 |
| Pago aprobado pero UI sigue en `pending` | Idempotencia en KV falló o webhook perdido | Implementar verificación manual en `/cuenta/mis-inscripciones` (Fase 2) |

## Próximo paso

Ir a [docs/RESEND_SETUP.md](./RESEND_SETUP.md) para configurar el envío de emails.
