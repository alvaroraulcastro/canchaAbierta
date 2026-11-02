# Google Calendar — canchaAbierta

## Objetivo

Crear eventos en el calendario **primary** del jugador cuando su inscripción queda `paid`, si conectó Calendar desde `/cuenta/integraciones`.

## GCP

1. En el mismo proyecto OAuth de login, habilitar **Google Calendar API**.
2. En la pantalla de consentimiento OAuth, agregar el scope:
   - `https://www.googleapis.com/auth/calendar.events`
3. Si la app está en producción, Google puede exigir **verificación** del scope (plazo de días/semanas).

## Auth.js

- Provider adicional `google-calendar` en [`lib/auth/config.ts`](../lib/auth/config.ts).
- Tras el consentimiento, el `refresh_token` se cifra con [`lib/crypto/seal.ts`](../lib/crypto/seal.ts) y se guarda en la hoja `Jugadores` (`calendarRefreshTokenEnc`).

## Flujo jugador

1. `/cuenta/integraciones` → **Conectar Google Calendar**
2. Pagar un partido (Flow) → webhook/confirma pago → [`lib/google/calendar.ts`](../lib/google/calendar.ts) crea evento y guarda `calendarEventId` en `Inscripciones`.
3. Cancelar inscripción pagada → se intenta borrar el evento en Calendar.

## Seguridad

- Scope mínimo `calendar.events` (no lectura global de calendarios ajenos al insert/delete).
- Rotar `AUTH_SECRET` invalida tokens cifrados; el jugador debe reconectar Calendar.

## Smoke test

1. Conectar Calendar en integraciones.
2. Inscribirse y pagar (sandbox Flow).
3. Ver evento en Google Calendar y columna `calendarEventId` en Sheets.
