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

## Cómo crear las hojas

### Opción A — Apps Script (recomendada, sin service account)

1. Abrir https://docs.google.com/spreadsheets/d/`1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM`/edit
2. Menú **Extensiones** → **Apps Script**
3. Borrar el archivo `Código.gs` y pegar el contenido de [`scripts/setup-sheets.gs`](./scripts/setup-sheets.gs)
4. **Guardar** (ícono de disquete o Ctrl+S)
5. En el selector de funciones elegir `setupSheets` → **Ejecutar**
6. Aceptar la autorización de Google. Si aparece *"Google no verificó esta app"*: **Avanzado** → **Ir a setup-sheets (no seguro)** → **Permitir**
7. Revisar la consola de ejecución: debe decir `OK: las 7 hojas del schema de canchaAbierta quedaron listas`

> ⚠ Si más adelante vas a instalar el trigger de revalidate ([APPS_SCRIPT_SETUP.md](./APPS_SCRIPT_SETUP.md)), agrégalo como **archivo nuevo** del mismo proyecto (**+** → *Script*). No sobrescribas `setup-sheets.gs` si vas a volver a ejecutarlo.

La función es **idempotente**: se puede ejecutar cuantas veces se quiera. No duplica hojas ni filas.

Al terminar el documento queda adaptado a la aplicación:

- Las 7 hojas en el orden exacto del modelo de datos, con los encabezados de la fila 1
- Fila 1 congelada, en negrita y con fondo verde claro
- Columnas `dateTime`, `createdAt`, `updatedAt` y `timestamp` en formato texto (así los strings ISO 8601 no se convierten en fechas de Sheets)
- Listas desplegables en las columnas enum (`sport`, `status`, `level`, `paymentStatus`, `type`, `action`, `entity`)
- Filas de ejemplo de smoke test (una cancha, dos partidos, una inscripción pagada). Para quitarlas, seleccionar las filas 2+ y eliminarlas. Para no insertarlas, cambiar `WITH_EXAMPLES = false` en el script y volver a ejecutar
- La "Hoja 1" u otras pestañas vacías se eliminan automáticamente

### Opción B — manual

1. Abrir el Sheets
2. Si existe "Hoja 1", eliminarla (click derecho en la pestaña → Eliminar)
3. Crear las 7 hojas en el orden indicado (botón **+** abajo a la izquierda)
4. En cada hoja pegar los headers en la fila 1
5. Opcional: aplicar el formato descrito abajo

## Formato recomendado (lo aplica la Opción A)

- **Fila 1** (encabezados): negrita, fondo verde claro, **Vista → Congelar → 1 fila**
- **Columnas `dateTime`, `createdAt`, `updatedAt`, `timestamp`**: formato texto. El backend escribe y lee ISO 8601 con offset (ej. `2026-09-30T19:00:00-03:00`); si Sheets las formatea como fecha, el backend igual las parsea (serial → ISO), pero queda más limpio como texto
- **Columna `active`/`allowOverbook`/etc**: el backend acepta `TRUE`/`FALSE` como string o como booleano de Sheets (schema Zod normaliza ambos)
- **Validación en `paymentStatus`**: `pending,paid,failed,refunded,cancelled`
- **Validación en `status` de Partidos**: `open,closed,cancelled,completed`
- **Validación en `sport`**: `padel,babyfutbol`

## Opción C — bootstrap automático con service account

Si ya tienes el JSON del service account configurado en `.env`, se pueden crear las hojas vía Node:

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
