import { cache } from "react";
import { unstable_cache } from "next/cache";
import { parseRows, playerSchema, type Player } from "@/lib/sheets/schemas";
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
