#!/usr/bin/env node
/**
 * Bootstrap del Sheets de canchaAbierta.
 *
 * Crea las 7 hojas si no existen, escribe los encabezados y (opcionalmente)
 * las filas de ejemplo para tener datos de smoke test.
 *
 * Uso:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL=... \
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..." \
 *   GOOGLE_SHEETS_ID=1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM \
 *   node docs/scripts/bootstrap-sheets.mjs [--with-examples] [--force]
 *
 * Pre-requisito:
 *   npm install --save-dev googleapis
 */

import { google } from "googleapis";

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_ID || "1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM";

const HEADERS = {
  Venues: [
    "id",
    "name",
    "address",
    "lat",
    "lng",
    "contactPhone",
    "photoUrl",
    "active",
  ],
  Canchas: [
    "id",
    "venueId",
    "name",
    "sport",
    "capacity",
    "priceCLP",
    "photoUrl",
    "active",
  ],
  Partidos: [
    "id",
    "courtId",
    "dateTime",
    "durationMin",
    "maxPlayers",
    "currentPlayers",
    "allowOverbook",
    "requiresExtraConfirmation",
    "status",
    "createdBy",
    "createdAt",
  ],
  Jugadores: [
    "email",
    "name",
    "phone",
    "level",
    "preferredPosition",
    "createdAt",
  ],
  Inscripciones: [
    "id",
    "matchId",
    "playerEmail",
    "amountCLP",
    "paymentStatus",
    "flowToken",
    "flowOrderId",
    "overbookRequested",
    "adminApproved",
    "createdAt",
    "updatedAt",
  ],
  Notificaciones: [
    "id",
    "recipientEmail",
    "type",
    "title",
    "body",
    "link",
    "read",
    "createdAt",
  ],
  AdminAudit: [
    "timestamp",
    "adminEmail",
    "action",
    "entity",
    "entityId",
    "before",
    "after",
  ],
};

const EXAMPLE_ROWS = {
  Venues: [
    [
      "venue-ejemplo",
      "Centro Deportivo Providencia",
      "Av. Pedro de Valdivia 100, Providencia",
      -33.428,
      -70.618,
      "+56 2 2345 6789",
      "https://ejemplo.cl/foto.jpg",
      "TRUE",
    ],
  ],
  Canchas: [
    [
      "court-padel-1",
      "venue-ejemplo",
      "Cancha Padél 1",
      "padel",
      4,
      12000,
      "https://ejemplo.cl/padel1.jpg",
      "TRUE",
    ],
    [
      "court-baby-1",
      "venue-ejemplo",
      "Babyfutbol Central",
      "babyfutbol",
      10,
      8000,
      "https://ejemplo.cl/baby1.jpg",
      "TRUE",
    ],
  ],
  Partidos: [
    [
      "match-001",
      "court-padel-1",
      "2026-09-30T19:00:00-03:00",
      90,
      4,
      0,
      "FALSE",
      "FALSE",
      "open",
      "admin@canchaabierta.cl",
      "2026-09-29T12:00:00-03:00",
    ],
  ],
  Jugadores: [
    [
      "jugador1@gmail.com",
      "Camila Soto",
      "+56 9 8765 4321",
      "intermedio",
      "mediocampista",
      "2026-09-29T10:00:00-03:00",
    ],
  ],
  Inscripciones: [
    [
      "ins-001",
      "match-001",
      "jugador1@gmail.com",
      12000,
      "paid",
      "token-fake-abc123",
      "1700000000",
      "FALSE",
      "",
      "2026-09-29T10:05:00-03:00",
      "2026-09-29T10:06:30-03:00",
    ],
  ],
  Notificaciones: [
    [
      "notif-001",
      "jugador1@gmail.com",
      "inscription_confirmed",
      "Inscripcion confirmada",
      "Te inscribiste al partido match-001.",
      "/cuenta/inscripciones/ins-001",
      "FALSE",
      "2026-09-29T10:06:30-03:00",
    ],
  ],
  AdminAudit: [
    [
      "2026-09-29T12:00:00-03:00",
      "admin@canchaabierta.cl",
      "create",
      "court",
      "court-padel-2",
      "",
      '{"name":"Cancha Padél 2","sport":"padel","capacity":4,"priceCLP":14000,"active":true}',
    ],
  ],
};

const args = new Set(process.argv.slice(2));
const withExamples = args.has("--with-examples");
const force = args.has("--force");

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    );
  }
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function main() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = new Set(meta.data.sheets.map((s) => s.properties.title));

  console.log(`Workbook: ${meta.data.properties.title}`);
  console.log(`Hojas existentes: ${[...existing].join(", ") || "(ninguna)"}`);

  const requests = [];
  const headerWrites = [];

  for (const [name, headers] of Object.entries(HEADERS)) {
    if (existing.has(name)) {
      if (force) {
        headerWrites.push({ sheet: name, headers });
      } else {
        console.log(`  - ${name}: ya existe, saltando`);
      }
    } else {
      requests.push({
        addSheet: {
          properties: { title: name, gridProperties: { frozenRowCount: 1 } },
        },
      });
      headerWrites.push({ sheet: name, headers });
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
    console.log(`Creadas ${requests.length} hojas nuevas`);
  }

  for (const { sheet, headers } of headerWrites) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheet}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    console.log(`  - ${sheet}: encabezados escritos`);
  }

  if (withExamples) {
    for (const [name, rows] of Object.entries(EXAMPLE_ROWS)) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${name}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
      console.log(`  - ${name}: ${rows.length} fila(s) de ejemplo`);
    }
  }

  console.log("\nListo.");
  console.log("Verificacion rapida:");
  console.log(
    `  https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
