export const CACHE_REVALIDATE_SECONDS = 60;

export const SHEET_NAMES = [
  "Venues",
  "Canchas",
  "Partidos",
  "Jugadores",
  "Inscripciones",
  "Notificaciones",
  "AdminAudit",
] as const;

export type SheetName = (typeof SHEET_NAMES)[number];

export const SHEET_TAGS = {
  Venues: "venues",
  Canchas: "courts",
  Partidos: "matches",
  Jugadores: "players",
  Inscripciones: "inscriptions",
  Notificaciones: "notifications",
  AdminAudit: "audit",
} as const;

export const SHEET_TAG_VALUES = [
  "venues",
  "courts",
  "matches",
  "players",
  "inscriptions",
  "notifications",
  "audit",
] as const;

export type SheetTag = (typeof SHEET_TAG_VALUES)[number];

export function matchTag(id: string): string {
  return `matches:${id}`;
}

export function inscriptionsTag(matchId: string): string {
  return `inscriptions:${matchId}`;
}

export function tagForSheet(sheet: SheetName): SheetTag {
  return SHEET_TAGS[sheet];
}

export function sheetForTag(tag: SheetTag): SheetName {
  const entry = SHEET_NAMES.find((name) => SHEET_TAGS[name] === tag);
  if (!entry) {
    throw new Error("Tag de hoja desconocido");
  }
  return entry;
}
