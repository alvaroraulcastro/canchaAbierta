import { cache } from "react";
import { unstable_cache } from "next/cache";
import { courtSchema, parseRows, type Court } from "@/lib/sheets/schemas";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";

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
