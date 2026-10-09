import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { APP_TZ, type Sport } from "@/lib/time";

const logger = createLogger("sheets/schemas");

export const SPORT_VALUES = ["padel", "babyfutbol"] as const satisfies readonly Sport[];
export const MATCH_STATUS_VALUES = ["open", "closed", "cancelled", "completed"] as const;
export const LEVEL_VALUES = ["principiante", "intermedio", "avanzado"] as const;
export const PAYMENT_STATUS_VALUES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;
export const NOTIFICATION_TYPE_VALUES = [
  "inscription_confirmed",
  "payment_received",
  "match_cancelled",
  "overbook_pending",
  "overbook_approved",
  "match_reminder",
] as const;
export const AUDIT_ACTION_VALUES = ["create", "update", "delete"] as const;
export const AUDIT_ENTITY_VALUES = ["venue", "court", "match", "inscription"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];
export type NotificationType = (typeof NOTIFICATION_TYPE_VALUES)[number];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function sheetsSerialToIso(serial: number): string {
  const days = Math.floor(serial);
  const fraction = serial - days;
  const utc = new Date(Date.UTC(1899, 11, 30) + days * 86_400_000);
  const totalMinutes = Math.round(fraction * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const naive = `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}T${pad(hours)}:${pad(minutes)}:00`;
  return fromZonedTime(naive, APP_TZ).toISOString();
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

const requiredText = z.unknown().transform((value, ctx) => {
  const text = asString(value);
  if (!text) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Campo requerido" });
    return z.NEVER;
  }
  return text;
});

const optionalText = z.unknown().transform((value) => asString(value) ?? "");

const requiredNumber = z.unknown().transform((value, ctx) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número inválido" });
  return z.NEVER;
});

const requiredBool = z.unknown().transform((value, ctx): boolean => {
  if (value === true || value === "TRUE" || value === "true") return true;
  if (value === false || value === "FALSE" || value === "false") return false;
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Booleano inválido" });
  return z.NEVER;
});

const optionalBool = z.unknown().transform((value, ctx): boolean | null => {
  if (value === undefined || value === null || value === "") return null;
  if (value === true || value === "TRUE" || value === "true") return true;
  if (value === false || value === "FALSE" || value === "false") return false;
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Booleano inválido" });
  return z.NEVER;
});

const isoDate = z.unknown().transform((value, ctx) => {
  if (typeof value === "number" && Number.isFinite(value)) return sheetsSerialToIso(value);
  const text = asString(value);
  if (!text || Number.isNaN(Date.parse(text))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha inválida" });
    return z.NEVER;
  }
  return new Date(text).toISOString();
});

function requiredEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.unknown().transform((value, ctx) => {
    const text = asString(value);
    if (text && (values as readonly string[]).includes(text)) return text as T[number];
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor inválido" });
    return z.NEVER;
  });
}

function optionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.unknown().transform((value, ctx) => {
    if (value === undefined || value === null || value === "") return null;
    const text = asString(value);
    if (text && (values as readonly string[]).includes(text)) return text as T[number];
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor inválido" });
    return z.NEVER;
  });
}

export const venueSchema = z.object({
  id: requiredText,
  name: requiredText,
  address: optionalText,
  lat: requiredNumber,
  lng: requiredNumber,
  contactPhone: optionalText,
  photoUrl: optionalText,
  active: requiredBool,
});

export const courtSchema = z.object({
  id: requiredText,
  venueId: requiredText,
  name: requiredText,
  sport: requiredEnum(SPORT_VALUES),
  capacity: requiredNumber,
  priceCLP: requiredNumber,
  photoUrl: optionalText,
  active: requiredBool,
});

export const matchSchema = z.object({
  id: requiredText,
  courtId: requiredText,
  dateTime: isoDate,
  durationMin: requiredNumber,
  maxPlayers: requiredNumber,
  currentPlayers: requiredNumber,
  allowOverbook: requiredBool,
  requiresExtraConfirmation: requiredBool,
  status: requiredEnum(MATCH_STATUS_VALUES),
  createdBy: optionalText,
  createdAt: isoDate,
});

export const playerSchema = z.object({
  email: requiredText,
  name: optionalText,
  phone: optionalText,
  level: optionalEnum(LEVEL_VALUES),
  preferredPosition: optionalText,
  createdAt: isoDate,
});

export const inscriptionSchema = z.object({
  id: requiredText,
  matchId: requiredText,
  playerEmail: requiredText,
  amountCLP: requiredNumber,
  paymentStatus: requiredEnum(PAYMENT_STATUS_VALUES),
  flowToken: optionalText,
  flowOrderId: optionalText,
  overbookRequested: requiredBool,
  adminApproved: optionalBool,
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const notificationSchema = z.object({
  id: requiredText,
  recipientEmail: requiredText,
  type: requiredEnum(NOTIFICATION_TYPE_VALUES),
  title: requiredText,
  body: optionalText,
  link: optionalText,
  read: requiredBool,
  createdAt: isoDate,
});

export const auditSchema = z.object({
  timestamp: isoDate,
  adminEmail: requiredText,
  action: requiredEnum(AUDIT_ACTION_VALUES),
  entity: requiredEnum(AUDIT_ENTITY_VALUES),
  entityId: requiredText,
  before: optionalText,
  after: optionalText,
});

export type Venue = z.infer<typeof venueSchema>;
export type Court = z.infer<typeof courtSchema>;
export type Match = z.infer<typeof matchSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Inscription = z.infer<typeof inscriptionSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type AuditEntry = z.infer<typeof auditSchema>;

export function parseRows<S extends z.ZodTypeAny>(
  sheet: string,
  rows: Record<string, unknown>[],
  schema: S,
): z.infer<S>[] {
  const parsed: z.infer<S>[] = [];
  let skipped = 0;
  for (const row of rows) {
    const result = schema.safeParse(row);
    if (result.success) {
      parsed.push(result.data);
    } else {
      skipped += 1;
    }
  }
  if (skipped > 0) {
    logger.warn(`Se omitieron ${skipped} filas inválidas en ${sheet}`);
  }
  return parsed;
}
