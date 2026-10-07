import { cache } from "react";
import { unstable_cache } from "next/cache";
import { parseRows, playerSchema, type Player } from "@/lib/sheets/schemas";
import { appendSheetRow, findSheetRowByColumn, updateSheetRow } from "@/lib/sheets/mutate";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";

async function loadPlayers(): Promise<Player[]> {
  const rows = await readSheet("Jugadores");
  return parseRows("Jugadores", rows, playerSchema);
}

const readPlayers = unstable_cache(loadPlayers, ["sheet:players"], {
  tags: [SHEET_TAGS.Jugadores],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listPlayers = cache(async (): Promise<Player[]> => readPlayers());

export const getPlayer = cache(async (email: string): Promise<Player | null> => {
  const players = await listPlayers();
  const normalized = email.trim().toLowerCase();
  return players.find((player) => player.email.toLowerCase() === normalized) ?? null;
});

export type PlayerProfileInput = {
  email: string;
  name: string;
  phone: string;
  level: "principiante" | "intermedio" | "avanzado" | null;
  preferredPosition: string;
};

export async function upsertPlayerProfile(input: PlayerProfileInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const row = await findSheetRowByColumn("Jugadores", "email", email);
  const values = {
    name: input.name,
    phone: input.phone,
    level: input.level ?? "",
    preferredPosition: input.preferredPosition,
  };
  if (row) {
    await updateSheetRow("Jugadores", row.rowNumber, row.headers, values);
    return;
  }
  await appendSheetRow("Jugadores", [
    email,
    values.name,
    values.phone,
    values.level,
    values.preferredPosition,
    now,
  ]);
}
