# Google Sheets — Schema y bootstrap

> **Resultado esperado**: el workbook `1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM` con las **7 hojas** del modelo de datos, sus encabezados en la fila 1, y (opcional) las filas de ejemplo necesarias para hacer un smoke test del backend.

## Hojas requeridas

Nombres **exactos** (case-sensitive, sin tildes, sin espacios). En este orden:

1. `Venues`
2. `Canchas`
3. `Partidos`
4. `Jugadores`
5. `Inscripciones`
6. `Notificaciones`
7. `AdminAudit`

## Headers por hoja

Pegar tal cual en la fila 1 de cada hoja (los nombres de columna coinciden con los Zod schemas en `lib/sheets/schemas.ts` cuando se implementen en Fase 1).

### `Venues`

```
id | name | address | lat | lng | contactPhone | photoUrl | active
```

Ejemplo (fila 2):

```
venue-ejemplo | Centro Deportivo Providencia | Av. Pedro de Valdivia 100, Providencia | -33.4280 | -70.6180 | +56 2 2345 6789 | https://ejemplo.cl/foto.jpg | TRUE
```

### `Canchas`

```
id | venueId | name | sport | capacity | priceCLP | photoUrl | active
```

Ejemplo:

```
court-padel-1 | venue-ejemplo | Cancha Pádel 1 | padel | 4 | 12000 | https://ejemplo.cl/padel1.jpg | TRUE
court-baby-1 | venue-ejemplo | Babyfútbol Central | babyfutbol | 10 | 8000 | https://ejemplo.cl/baby1.jpg | TRUE
```

### `Partidos`

```
id | courtId | dateTime | durationMin | maxPlayers | currentPlayers | allowOverbook | requiresExtraConfirmation | status | createdBy | createdAt
```

Ejemplo (un partido de pádel para mañana a las 19:00):

```
match-001 | court-padel-1 | 2026-09-30T19:00:00-03:00 | 90 | 4 | 0 | FALSE | FALSE | open | admin@canchaabierta.cl | 2026-09-29T12:00:00-03:00
```

> **Importante**: `dateTime` y `createdAt` siempre en **ISO 8601 con offset** explícito (ej. `-03:00` para Chile). El backend los parsea con `date-fns-tz` interpretándolos como `America/Santiago`.

### `Jugadores`

```
email | name | phone | level | preferredPosition | createdAt
```

Ejemplo:

```
jugador1@gmail.com | Camila Soto | +56 9 8765 4321 | intermedio | mediocampista | 2026-09-29T10:00:00-03:00
```

### `Inscripciones`

```
id | matchId | playerEmail | amountCLP | paymentStatus | flowToken | flowOrderId | overbookRequested | adminApproved | createdAt | updatedAt
```

Ejemplo:

```
ins-001 | match-001 | jugador1@gmail.com | 12000 | paid | token-fake-abc123 | 1700000000 | FALSE |  | 2026-09-29T10:05:00-03:00 | 2026-09-29T10:06:30-03:00
```

### `Notificaciones`

```
id | recipientEmail | type | title | body | link | read | createdAt
```

Ejemplo:

```
notif-001 | jugador1@gmail.com | inscription_confirmed | Inscripción confirmada | Te inscribiste al partido match-001. | /cuenta/inscripciones/ins-001 | FALSE | 2026-09-29T10:06:30-03:00
```

Tipos válidos de `type` (mantener exactamente estos strings):

- `inscription_confirmed`
- `payment_received`
- `match_cancelled`
- `overbook_pending`
- `overbook_approved`
- `match_reminder`

### `AdminAudit`

```
timestamp | adminEmail | action | entity | entityId | before | after
```

Ejemplo (al crear la cancha):

```
2026-09-29T12:00:00-03:00 | admin@canchaabierta.cl | create | court | court-padel-2 |  | {"name":"Cancha Pádel 2","sport":"padel","capacity":4,"priceCLP":14000,"active":true}
```

`before` y `after` son **JSON serializado en string** (Sheets no tiene tipo JSON nativo). El backend los serializa con `JSON.stringify` al escribir y `JSON.parse` al leer.

## Cómo crear las hojas (manual)

1. Abrir https://docs.google.com/spreadsheets/d/`1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM`/edit
2. Si existe "Hoja 1", eliminarla (click derecho en la pestaña → Eliminar)
3. Crear las 7 hojas en el orden indicado (botón **+** abajo a la izquierda)
4. En cada hoja pegar los headers en la fila 1
5. Opcional: agregar las filas de ejemplo de arriba para tener datos de smoke test
6. Opcional: aplicar formato (Congelar fila 1, negrita, colores alternos) — el backend no lo necesita

## Formato recomendado (opcional pero útil)

- **Fila 1** (encabezados): negrita, fondo gris claro, **Vista → Congelar → 1 fila**
- **Columna `dateTime` y `createdAt`**: Formato → Número → Fecha y hora (los valores deben seguir siendo ISO 8601 con offset para que el backend los parsee)
- **Columna `active`/`allowOverbook`/etc**: el backend espera los strings `TRUE`/`FALSE`. Sheets los guarda como booleanos; al leerlos vía API llegan como `true`/`false` (en minúscula), por lo que el schema Zod debe aceptar ambos.
- **Validación en `paymentStatus`** (opcional): Datos → Validación de datos → Lista de elementos: `pending,paid,failed,refunded,cancelled`
- **Validación en `status` de Partidos**: `open,closed,cancelled,completed`
- **Validación en `sport`**: `padel,babyfutbol`

## Bootstrap automático (alternativa)

Si prefieres crear las hojas vía script (requiere `googleapis`):

```bash
npm install --save-dev googleapis
GOOGLE_SERVICE_ACCOUNT_EMAIL=... \
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="..." \
GOOGLE_SHEETS_ID=1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM \
node docs/scripts/bootstrap-sheets.mjs
```

El script está en [`docs/scripts/bootstrap-sheets.mjs`](./scripts/bootstrap-sheets.mjs). Crea las 7 hojas si no existen (no las duplica), escribe los encabezados y, si pasas `--with-examples`, agrega las filas de ejemplo de arriba.

Flags:

- `--with-examples`: agrega las filas de ejemplo (útil para dev)
- `--force`: si una hoja ya existe pero está vacía, igual escribe los headers

## Verificación

Pegar en la consola de Apps Script (Extensiones → Apps Script):

```javascript
function check() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const expected = ['Venues','Canchas','Partidos','Jugadores','Inscripciones','Notificaciones','AdminAudit'];
  const actual = ss.getSheets().map(s => s.getName());
  const missing = expected.filter(n => !actual.includes(n));
  if (missing.length) {
    Logger.log(`Faltan: ${missing.join(', ')}`);
  } else {
    Logger.log('OK: las 7 hojas existen');
  }
}
```

Ejecutar y revisar **Ejecuciones** → última fila → debería decir `OK: las 7 hojas existen`.

## Próximo paso

Ir a [docs/APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md) para instalar el trigger que sincroniza cambios del Sheets con la app en tiempo real.
