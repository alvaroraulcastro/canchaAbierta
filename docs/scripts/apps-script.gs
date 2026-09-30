/**
 * Apps Script para canchaAbierta.
 *
 * Trigger onChange: cuando se modifica una celda en el Sheets,
 * notifica a /api/sheets/revalidate para invalidar el cache de la hoja.
 *
 * Instalacion: ver docs/APPS_SCRIPT_SETUP.md
 */

const SHEET_TO_TAG = {
  Venues: "venues",
  Canchas: "courts",
  Partidos: "matches",
  Jugadores: "players",
  Inscripciones: "inscriptions",
  Notificaciones: "notifications",
  AdminAudit: "audit",
};

function onChange(e) {
  const props = PropertiesService.getScriptProperties();
  const siteUrl = props.getProperty("NEXT_PUBLIC_SITE_URL");
  const secret = props.getProperty("SHEETS_REVALIDATE_SECRET");

  if (!siteUrl || !secret) {
    console.error(
      "Faltan NEXT_PUBLIC_SITE_URL o SHEETS_REVALIDATE_SECRET en propiedades del script",
    );
    return;
  }

  let sheetName;
  try {
    sheetName = e && e.source ? e.source.getActiveSheet().getName() : null;
  } catch (err) {
    console.warn("No se pudo obtener hoja activa desde el evento:", err);
  }

  if (!sheetName) {
    console.warn("No se pudo determinar el nombre de la hoja");
    return;
  }

  const tag = SHEET_TO_TAG[sheetName];
  if (!tag) {
    console.warn(`Sin mapeo de tag para la hoja "${sheetName}"`);
    return;
  }

  const endpoint = `${siteUrl.replace(/\/$/, "")}/api/sheets/revalidate`;
  const payload = JSON.stringify({ sheet: sheetName, tag });

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "X-Secret": secret },
    payload: payload,
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    const code = response.getResponseCode();
    const body = response.getContentText();
    console.log(`revalidate ${tag}: HTTP ${code} - ${body}`);
  } catch (err) {
    console.error(`Fallo al llamar a ${endpoint}:`, err);
  }
}

function installOnChangeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some((t) => t.getHandlerFunction() === "onChange");
  if (exists) {
    console.log("Trigger onChange ya existe");
    return;
  }
  ScriptApp.newTrigger("onChange")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onChange()
    .create();
  console.log("Trigger onChange instalado");
}
