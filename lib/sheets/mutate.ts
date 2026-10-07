import { getSheetsClient, getSpreadsheetId } from "@/lib/sheets/client";
import type { SheetName } from "@/lib/sheets/tags";

export type SheetLocatedRow = {
  rowNumber: number;
  headers: string[];
  values: unknown[];
};

function columnLetter(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function sheetsError(sheet: SheetName, error: unknown): Error {
  const status =
    typeof error === "object" && error !== null && "code" in error
      ? Number((error as { code: unknown }).code)
      : undefined;
  if (status === 403) {
    return new Error(`Sin permiso para escribir "${sheet}". Comparte el Sheets como Editor.`);
  }
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Unable to parse range") || message.includes("Requested entity was not found")) {
    return new Error(`La hoja "${sheet}" no existe en el Google Sheets`);
  }
  return new Error(`No se pudo escribir la hoja "${sheet}"`);
}

export async function findSheetRowByColumn(
  sheet: SheetName,
  column: string,
  value: string,
): Promise<SheetLocatedRow | null> {
  const sheets = getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `'${sheet}'!A:Z`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const rows = response.data.values ?? [];
    const headerRow = rows[0];
    if (!headerRow) return null;
    const headers = headerRow.map((header) => String(header).trim());
    const columnIndex = headers.indexOf(column);
    if (columnIndex < 0) return null;
    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index] ?? [];
      const cell = row[columnIndex];
      if (cell !== undefined && String(cell).trim() === value) {
        return { rowNumber: index + 1, headers, values: row };
      }
    }
    return null;
  } catch (error) {
    throw sheetsError(sheet, error);
  }
}

export async function updateSheetRow(
  sheet: SheetName,
  rowNumber: number,
  headers: string[],
  updates: Record<string, string | number>,
): Promise<void> {
  const data = Object.entries(updates).flatMap(([key, value]) => {
    const index = headers.indexOf(key);
    if (index < 0) return [];
    return [
      {
        range: `'${sheet}'!${columnLetter(index)}${rowNumber}`,
        values: [[value]],
      },
    ];
  });
  if (data.length === 0) return;
  const sheets = getSheetsClient();
  try {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      requestBody: { valueInputOption: "RAW", data },
    });
  } catch (error) {
    throw sheetsError(sheet, error);
  }
}

export async function appendSheetRow(sheet: SheetName, values: Array<string | number>): Promise<void> {
  const sheets = getSheetsClient();
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: `'${sheet}'!A:Z`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
  } catch (error) {
    throw sheetsError(sheet, error);
  }
}
