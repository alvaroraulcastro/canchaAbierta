import { startOfDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

export const APP_TZ = "America/Santiago" as const;

export type Sport = "padel" | "babyfutbol";

export function nowInSantiago(): Date {
  return toZonedTime(new Date(), APP_TZ);
}

export function isoFromSantiago(date: Date): string {
  return formatInTimeZone(date, APP_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function formatMatchDateTime(iso: string): string {
  const date = new Date(iso);
  return formatInTimeZone(date, APP_TZ, "EEEE d 'de' MMMM, HH:mm 'hrs'", { locale: es });
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return formatInTimeZone(date, APP_TZ, "dd MMM, HH:mm 'hrs'", { locale: es });
}

export function toSantiago(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return toZonedTime(d, APP_TZ);
}

export function fromSantiago(date: Date): Date {
  return fromZonedTime(date, APP_TZ);
}

export function startOfTodayInSantiagoMs(nowMs = Date.now()): number {
  const zonedNow = toZonedTime(new Date(nowMs), APP_TZ);
  const zonedStart = startOfDay(zonedNow);
  return fromZonedTime(zonedStart, APP_TZ).getTime();
}
