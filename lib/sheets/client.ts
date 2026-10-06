import { google, type sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let sheetsClient: sheets_v4.Sheets | undefined;

export function sheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.GOOGLE_SHEETS_ID,
  );
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) {
    throw new Error("Falta GOOGLE_SHEETS_ID");
  }
  return id;
}

function privateKey(): string {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "";
  return raw.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = privateKey();
  if (!email || !key) {
    throw new Error("Faltan las credenciales del service account de Google Sheets");
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: SCOPES,
  });
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}
