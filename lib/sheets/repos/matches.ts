import { cache } from "react";
import { unstable_cache } from "next/cache";
import { MATCH_STATUS_VALUES, matchSchema, parseRows, type Match } from "@/lib/sheets/schemas";
import { appendSheetRow, findSheetRowByColumn, updateSheetRow } from "@/lib/sheets/mutate";
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

export type MatchWriteInput = {
  id: string;
  courtId: string;
  dateTime: string;
  durationMin: number;
  maxPlayers: number;
  currentPlayers: number;
  allowOverbook: boolean;
  requiresExtraConfirmation: boolean;
  status: Match["status"];
  createdBy: string;
  createdAt: string;
};

export async function createMatchRow(input: MatchWriteInput): Promise<void> {
  if (!(MATCH_STATUS_VALUES as readonly string[]).includes(input.status)) {
    throw new Error("Estado de partido inválido");
  }
  await appendSheetRow("Partidos", [
    input.id,
    input.courtId,
    input.dateTime,
    input.durationMin,
    input.maxPlayers,
    input.currentPlayers,
    input.allowOverbook ? "TRUE" : "FALSE",
    input.requiresExtraConfirmation ? "TRUE" : "FALSE",
    input.status,
    input.createdBy,
    input.createdAt,
  ]);
}

export async function updateMatchFields(
  matchId: string,
  updates: Partial<{
    courtId: string;
    dateTime: string;
    durationMin: number;
    maxPlayers: number;
    allowOverbook: boolean;
    requiresExtraConfirmation: boolean;
    status: Match["status"];
  }>,
): Promise<Match | null> {
  const row = await findSheetRowByColumn("Partidos", "id", matchId);
  if (!row) return null;
  const before = await getMatch(matchId);
  const payload: Record<string, string | number> = {};
  if (updates.courtId !== undefined) payload.courtId = updates.courtId;
  if (updates.dateTime !== undefined) payload.dateTime = updates.dateTime;
  if (updates.durationMin !== undefined) payload.durationMin = updates.durationMin;
  if (updates.maxPlayers !== undefined) payload.maxPlayers = updates.maxPlayers;
  if (updates.allowOverbook !== undefined) {
    payload.allowOverbook = updates.allowOverbook ? "TRUE" : "FALSE";
  }
  if (updates.requiresExtraConfirmation !== undefined) {
    payload.requiresExtraConfirmation = updates.requiresExtraConfirmation ? "TRUE" : "FALSE";
  }
  if (updates.status !== undefined) payload.status = updates.status;
  if (Object.keys(payload).length === 0) return before;
  await updateSheetRow("Partidos", row.rowNumber, row.headers, payload);
  return before;
}

export async function incrementMatchPlayers(matchId: string): Promise<void> {
  const row = await findSheetRowByColumn("Partidos", "id", matchId);
  if (!row) throw new Error("No se encontró el partido de la inscripción");
  const index = row.headers.indexOf("currentPlayers");
  if (index < 0) throw new Error("La hoja Partidos no tiene la columna currentPlayers");
  const raw = row.values[index];
  const current = typeof raw === "number" ? raw : Number(raw ?? 0);
  if (!Number.isFinite(current)) throw new Error("currentPlayers del partido es inválido");
  await updateSheetRow("Partidos", row.rowNumber, row.headers, { currentPlayers: current + 1 });
}
