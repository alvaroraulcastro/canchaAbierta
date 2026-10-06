const ORDER = ["Venues", "Canchas", "Partidos", "Jugadores", "Inscripciones", "Notificaciones", "AdminAudit"];

const HEADERS = {
  Venues: ["id", "name", "address", "lat", "lng", "contactPhone", "photoUrl", "active"],
  Canchas: ["id", "venueId", "name", "sport", "capacity", "priceCLP", "photoUrl", "active"],
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
  Jugadores: ["email", "name", "phone", "level", "preferredPosition", "createdAt"],
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
  AdminAudit: ["timestamp", "adminEmail", "action", "entity", "entityId", "before", "after"],
};

const ENUMS = {
  sport: ["padel", "babyfutbol"],
  status: ["open", "closed", "cancelled", "completed"],
  level: ["principiante", "intermedio", "avanzado"],
  paymentStatus: ["pending", "paid", "failed", "refunded", "cancelled"],
  type: [
    "inscription_confirmed",
    "payment_received",
    "match_cancelled",
    "overbook_pending",
    "overbook_approved",
    "match_reminder",
  ],
  action: ["create", "update", "delete"],
  entity: ["venue", "court", "match", "inscription"],
};

const TEXT_FIELDS = ["dateTime", "createdAt", "timestamp", "updatedAt"];

const WITH_EXAMPLES = true;

function columnLetter(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    out = String.fromCharCode(65 + m) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function sheetTimeZone() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
}

function isoNow() {
  return Utilities.formatDate(new Date(), sheetTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function isoAt(daysAhead, hour) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return Utilities.formatDate(d, sheetTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function exampleRows() {
  const now = isoNow();
  const matchPadel = isoAt(1, 19);
  const matchBaby = isoAt(1, 20);
  return {
    Venues: [
      ["venue-ejemplo", "Centro Deportivo Providencia", "Av. Pedro de Valdivia 100, Providencia", -33.428, -70.618, "+56 2 2345 6789", "", true],
    ],
    Canchas: [
      ["court-padel-1", "venue-ejemplo", "Cancha Pádel 1", "padel", 4, 12000, "", true],
      ["court-baby-1", "venue-ejemplo", "Babyfútbol Central", "babyfutbol", 10, 8000, "", true],
    ],
    Partidos: [
      ["match-001", "court-padel-1", matchPadel, 90, 4, 1, false, false, "open", "admin@canchaabierta.cl", now],
      ["match-002", "court-baby-1", matchBaby, 90, 10, 0, false, false, "open", "admin@canchaabierta.cl", now],
    ],
    Jugadores: [
      ["jugador1@example.com", "Camila Soto", "+56 9 8765 4321", "intermedio", "mediocampista", now],
    ],
    Inscripciones: [
      ["ins-001", "match-001", "jugador1@example.com", 12000, "paid", "token-fake-abc123", "1700000000", false, "", now, now],
    ],
    Notificaciones: [
      ["notif-001", "jugador1@example.com", "inscription_confirmed", "Inscripción confirmada", "Te inscribiste al partido match-001.", "/cuenta/inscripciones/ins-001", false, now],
    ],
    AdminAudit: [
      [now, "admin@canchaabierta.cl", "create", "court", "court-padel-1", "", '{"name":"Cancha Pádel 1","sport":"padel","capacity":4,"priceCLP":12000,"active":true}'],
    ],
  };
}

function ensureSheet(ss, name, position) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(position);
  return sheet;
}

function writeHeaders(sheet, name) {
  const headers = HEADERS[name];
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const isEmpty = current.every((v) => v === "");
  if (isEmpty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else if (current.map(String).join("|") !== headers.join("|")) {
    console.warn(
      name + ": la fila 1 no coincide con el schema. Esperado: " + headers.join(", "),
    );
  }
}

function styleSheet(sheet, name) {
  const headers = HEADERS[name];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#e8f7e6");
  headerRange.setFontColor("#1f5a34");
  sheet.setFrozenRows(1);

  headers.forEach((header, index) => {
    const letter = columnLetter(index);
    const column = sheet.getRange(letter + ":" + letter);
    if (TEXT_FIELDS.indexOf(header) !== -1) {
      column.setNumberFormat("@");
      column.setWidth(190);
    } else if (header === "id" || header === "email" || header.indexOf("Id") !== -1) {
      column.setWidth(160);
    } else {
      column.setWidth(130);
    }

    const values = ENUMS[header];
    if (values) {
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(values, true)
        .setAllowInvalid(true)
        .setHelpText("Valores válidos: " + values.join(", "))
        .build();
      sheet.getRange(letter + "2:" + letter).setDataValidation(rule);
    }
  });
}

function addExamples(ss) {
  const rows = exampleRows();
  ORDER.forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() <= 1) {
      sheet
        .getRange(sheet.getLastRow() + 1, 1, rows[name].length, HEADERS[name].length)
        .setValues(rows[name]);
      console.log(name + ": " + rows[name].length + " fila(s) de ejemplo");
    }
  });
}

function removeExtraSheets(ss) {
  ss.getSheets().forEach(function (sheet) {
    const name = sheet.getName();
    if (ORDER.indexOf(name) === -1 && sheet.getLastRow() === 0) {
      ss.deleteSheet(sheet);
      console.log("Eliminada hoja vacía: " + name);
    }
  });
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ORDER.forEach(function (name, i) {
    const sheet = ensureSheet(ss, name, i + 1);
    writeHeaders(sheet, name);
    styleSheet(sheet, name);
    console.log(name + ": lista");
  });

  if (WITH_EXAMPLES) {
    addExamples(ss);
  }

  removeExtraSheets(ss);

  SpreadsheetApp.flush();
  console.log("OK: las 7 hojas del schema de canchaAbierta quedaron listas");
}
