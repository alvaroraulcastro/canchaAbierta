import { cache } from "react";
import { unstable_cache } from "next/cache";
import { parseRows, venueSchema, type Venue } from "@/lib/sheets/schemas";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";

async function loadVenues(): Promise<Venue[]> {
  const rows = await readSheet("Venues");
  return parseRows("Venues", rows, venueSchema);
}

const readVenues = unstable_cache(loadVenues, ["sheet:venues"], {
  tags: [SHEET_TAGS.Venues],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listVenues = cache(async (): Promise<Venue[]> => readVenues());

export const getVenue = cache(async (id: string): Promise<Venue | null> => {
  const venues = await listVenues();
  return venues.find((venue) => venue.id === id) ?? null;
});
