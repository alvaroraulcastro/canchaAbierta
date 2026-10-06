import { cache } from "react";
import { unstable_cache } from "next/cache";
import { inscriptionSchema, parseRows, type Inscription } from "@/lib/sheets/schemas";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, inscriptionsTag, SHEET_TAGS } from "@/lib/sheets/tags";

async function loadInscriptions(): Promise<Inscription[]> {
  const rows = await readSheet("Inscripciones");
  return parseRows("Inscripciones", rows, inscriptionSchema);
}

const readInscriptions = unstable_cache(loadInscriptions, ["sheet:inscriptions"], {
  tags: [SHEET_TAGS.Inscripciones],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listInscriptions = cache(async (): Promise<Inscription[]> => readInscriptions());

export const listInscriptionsByMatch = cache(async (matchId: string): Promise<Inscription[]> => {
  return unstable_cache(
    async () => {
      const inscriptions = await listInscriptions();
      return inscriptions.filter((inscription) => inscription.matchId === matchId);
    },
    ["sheet:inscriptions:match", matchId],
    {
      tags: [SHEET_TAGS.Inscripciones, inscriptionsTag(matchId)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    },
  )();
});

export const getInscription = cache(async (id: string): Promise<Inscription | null> => {
  const inscriptions = await listInscriptions();
  return inscriptions.find((inscription) => inscription.id === id) ?? null;
});
