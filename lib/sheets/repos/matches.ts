import { cache } from "react";
import { unstable_cache } from "next/cache";
import { matchSchema, parseRows, type Match } from "@/lib/sheets/schemas";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, matchTag, SHEET_TAGS } from "@/lib/sheets/tags";

async function loadMatches(): Promise<Match[]> {
  const rows = await readSheet("Partidos");
  return parseRows("Partidos", rows, matchSchema);
}

const readMatches = unstable_cache(loadMatches, ["sheet:matches"], {
  tags: [SHEET_TAGS.Partidos],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listMatches = cache(async (): Promise<Match[]> => readMatches());

export const getMatch = cache(async (id: string): Promise<Match | null> => {
  return unstable_cache(
    async () => {
      const matches = await listMatches();
      return matches.find((match) => match.id === id) ?? null;
    },
    ["sheet:match", id],
    {
      tags: [SHEET_TAGS.Partidos, matchTag(id)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    },
  )();
});
