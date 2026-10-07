import { cache } from "react";
import { unstable_cache } from "next/cache";
import { courtSchema, parseRows, type Court, SPORT_VALUES } from "@/lib/sheets/schemas";
import { appendSheetRow, findSheetRowByColumn, updateSheetRow } from "@/lib/sheets/mutate";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";
import type { Sport } from "@/lib/time";

async function loadCourts(): Promise<Court[]> {
  const rows = await readSheet("Canchas");
  return parseRows("Canchas", rows, courtSchema);
}

const readCourts = unstable_cache(loadCourts, ["sheet:courts"], {
  tags: [SHEET_TAGS.Canchas],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listCourts = cache(async (): Promise<Court[]> => readCourts());

export const getCourt = cache(async (id: string): Promise<Court | null> => {
  const courts = await listCourts();
  return courts.find((court) => court.id === id) ?? null;
});

export type CourtWriteInput = {
  id: string;
  venueId: string;
  name: string;
  sport: Sport;
  capacity: number;
  priceCLP: number;
  photoUrl: string;
  active: boolean;
};

function courtToRow(input: CourtWriteInput): Array<string | number> {
  return [
    input.id,
    input.venueId,
    input.name,
    input.sport,
    input.capacity,
    input.priceCLP,
    input.photoUrl,
    input.active ? "TRUE" : "FALSE",
  ];
}

export async function upsertCourt(input: CourtWriteInput): Promise<{ created: boolean; before: Court | null }> {
  if (!(SPORT_VALUES as readonly string[]).includes(input.sport)) {
    throw new Error("Deporte inválido");
  }
  const existing = await findSheetRowByColumn("Canchas", "id", input.id);
  if (existing) {
    const before = await getCourt(input.id);
    await updateSheetRow("Canchas", existing.rowNumber, existing.headers, {
      venueId: input.venueId,
      name: input.name,
      sport: input.sport,
      capacity: input.capacity,
      priceCLP: input.priceCLP,
      photoUrl: input.photoUrl,
      active: input.active ? "TRUE" : "FALSE",
    });
    return { created: false, before };
  }
  await appendSheetRow("Canchas", courtToRow(input));
  return { created: true, before: null };
}

export async function deactivateCourt(id: string): Promise<Court | null> {
  const row = await findSheetRowByColumn("Canchas", "id", id);
  if (!row) return null;
  const before = await getCourt(id);
  await updateSheetRow("Canchas", row.rowNumber, row.headers, { active: "FALSE" });
  return before;
}
