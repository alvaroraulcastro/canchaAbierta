import { getSheetsClient, getSpreadsheetId } from "@/lib/sheets/client";
import type { SheetName } from "@/lib/sheets/tags";

function mapSheetsError(sheet: SheetName, error: unknown): Error {
  const status =
    typeof error === "object" && error !== null && "code" in error
      ? Number((error as { code: unknown }).code)
      : undefined;
  if (status === 403) {
    return new Error(
      `Sin permiso para leer "${sheet}". Comparte el Sheets con el service account como Editor.`,
    );
  }
  if (status === 404) {
    return new Error("No se encontró el Google Sheets. Revisa GOOGLE_SHEETS_ID.");
  }
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("Unable to parse range") ||
    message.includes("Requested entity was not found")
  ) {
    return new Error(`La hoja "${sheet}" no existe en el Google Sheets`);
  }
  return new Error(`No se pudo leer la hoja "${sheet}"`);
}

export async function readSheet(sheet: SheetName): Promise<Record<string, unknown>[]> {
  const sheets = getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `'${sheet}'!A:Z`,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    const values = response.data.values ?? [];
    const headerRow = values[0];
    if (!headerRow || headerRow.length === 0) return [];

    const headers = headerRow.map((header) => String(header).trim());
    const records: Record<string, unknown>[] = [];

    for (const row of values.slice(1)) {
      const hasValue = row.some((cell) => cell !== "" && cell !== undefined && cell !== null);
      if (!hasValue) continue;

      const record: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        if (!header) return;
        const value = row[index];
        if (value === "" || value === undefined || value === null) return;
        record[header] = value;
      });
      records.push(record);
    }

    return records;
  } catch (error) {
    throw mapSheetsError(sheet, error);
  }
}
