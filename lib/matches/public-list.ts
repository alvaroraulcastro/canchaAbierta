import type { MatchView } from "@/lib/catalog";
import type { MatchesFilters } from "@/lib/search-params";
import { startOfTodayInSantiagoMs } from "@/lib/time";

const HIDDEN_PUBLIC_STATUSES = new Set(["cancelled", "completed"]);

export function isMatchVisibleInPublicList(
  match: MatchView,
  filters: MatchesFilters,
  nowMs = Date.now(),
): boolean {
  if (filters.sport && match.sport !== filters.sport) return false;
  if (HIDDEN_PUBLIC_STATUSES.has(match.status)) return false;

  if (filters.cuando === "todos") {
    return match.status === "open" || match.status === "closed";
  }

  if (match.status !== "open") return false;
  const matchMs = Date.parse(match.dateTime);
  if (Number.isNaN(matchMs)) return false;
  return matchMs >= startOfTodayInSantiagoMs(nowMs);
}

export function isMatchOpenForPublicSignup(match: MatchView, nowMs = Date.now()): boolean {
  if (match.status !== "open") return false;
  const matchMs = Date.parse(match.dateTime);
  if (Number.isNaN(matchMs)) return false;
  const endsAt = matchMs + match.durationMin * 60_000;
  return endsAt > nowMs;
}
