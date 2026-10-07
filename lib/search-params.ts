import { z } from "zod";
import { SPORT_VALUES } from "@/lib/sheets/schemas";

export type SearchParams = Record<string, string | string[] | undefined>;

export function readSearchParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const sportSchema = z.enum(SPORT_VALUES);
const querySchema = z.string().trim().max(80);
const whenSchema = z.enum(["proximos", "todos"]);

export type CourtsFilters = {
  sport?: (typeof SPORT_VALUES)[number];
  q?: string;
};

export type MatchesFilters = {
  sport?: (typeof SPORT_VALUES)[number];
  cuando: "proximos" | "todos";
};

export function parseCourtsFilters(params: SearchParams): CourtsFilters {
  const sport = sportSchema.safeParse(readSearchParam(params.sport));
  const q = querySchema.safeParse(readSearchParam(params.q) ?? "");
  return {
    sport: sport.success ? sport.data : undefined,
    q: q.success && q.data.length > 0 ? q.data : undefined,
  };
}

export function parseMatchesFilters(params: SearchParams): MatchesFilters {
  const sport = sportSchema.safeParse(readSearchParam(params.sport));
  const cuando = whenSchema.safeParse(readSearchParam(params.cuando));
  return {
    sport: sport.success ? sport.data : undefined,
    cuando: cuando.success ? cuando.data : "proximos",
  };
}
