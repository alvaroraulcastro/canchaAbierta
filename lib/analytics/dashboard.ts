import { cache } from "react";
import { unstable_cache } from "next/cache";
import { listMatchViews } from "@/lib/catalog";
import type { ResolvedAdmin } from "@/lib/auth/resolve-admin";
import { filterVenueIdsForAdmin } from "@/lib/auth/permissions";
import { listInscriptions } from "@/lib/sheets/repos/inscriptions";
import { listVenues } from "@/lib/sheets/repos/venues";
import type { Inscription } from "@/lib/sheets/schemas";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";

export type AnalyticsFilters = {
  venueId: string | null;
  fromMs: number;
  toMs: number;
};

export type AnalyticsDashboard = {
  paidCount: number;
  paidRevenueCLP: number;
  cancelledCount: number;
  pendingOverbookCount: number;
  checkedInCount: number;
  averageFillRate: number;
  byPaymentStatus: Record<string, number>;
};

function inscriptionInRange(inscription: Inscription, fromMs: number, toMs: number): boolean {
  const created = Date.parse(inscription.createdAt);
  return created >= fromMs && created <= toMs;
}

async function computeDashboard(
  admin: ResolvedAdmin,
  filters: AnalyticsFilters,
): Promise<AnalyticsDashboard> {
  const venues = await listVenues();
  const allowedVenueIds = new Set(
    filterVenueIdsForAdmin(
      admin,
      venues.map((v) => v.id),
    ),
  );

  let venueFilter = filters.venueId && allowedVenueIds.has(filters.venueId) ? filters.venueId : null;
  if (admin.role === "venue_admin" && !venueFilter && admin.venueIds.length === 1) {
    venueFilter = admin.venueIds[0] ?? null;
  }

  const [inscriptions, matches] = await Promise.all([listInscriptions(), listMatchViews()]);
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const scoped = inscriptions.filter((row) => {
    const match = matchById.get(row.matchId);
    if (!match) return false;
    if (!allowedVenueIds.has(match.venueId)) return false;
    if (venueFilter && match.venueId !== venueFilter) return false;
    return inscriptionInRange(row, filters.fromMs, filters.toMs);
  });

  let paidCount = 0;
  let paidRevenueCLP = 0;
  let cancelledCount = 0;
  let pendingOverbookCount = 0;
  let checkedInCount = 0;
  const byPaymentStatus: Record<string, number> = {};

  for (const row of scoped) {
    byPaymentStatus[row.paymentStatus] = (byPaymentStatus[row.paymentStatus] ?? 0) + 1;
    if (row.paymentStatus === "paid") {
      paidCount += 1;
      paidRevenueCLP += row.amountCLP;
      if (row.checkedInAt) checkedInCount += 1;
      if (row.overbookRequested && row.adminApproved === null) pendingOverbookCount += 1;
    }
    if (row.paymentStatus === "cancelled") cancelledCount += 1;
  }

  const scopedMatches = matches.filter((match) => {
    if (!allowedVenueIds.has(match.venueId)) return false;
    if (venueFilter && match.venueId !== venueFilter) return false;
    const t = Date.parse(match.dateTime);
    return t >= filters.fromMs && t <= filters.toMs;
  });

  let fillSum = 0;
  for (const match of scopedMatches) {
    if (match.maxPlayers <= 0) continue;
    fillSum += match.currentPlayers / match.maxPlayers;
  }
  const averageFillRate =
    scopedMatches.length === 0 ? 0 : fillSum / scopedMatches.length;

  return {
    paidCount,
    paidRevenueCLP,
    cancelledCount,
    pendingOverbookCount,
    checkedInCount,
    averageFillRate,
    byPaymentStatus,
  };
}

export const getAnalyticsDashboard = cache(
  async (admin: ResolvedAdmin, filters: AnalyticsFilters): Promise<AnalyticsDashboard> => {
    return unstable_cache(
      () => computeDashboard(admin, filters),
      [
        "analytics",
        admin.email,
        admin.role,
        String(filters.fromMs),
        String(filters.toMs),
        filters.venueId ?? "all",
      ],
      {
        tags: [SHEET_TAGS.Inscripciones, SHEET_TAGS.Partidos],
        revalidate: CACHE_REVALIDATE_SECONDS,
      },
    )();
  },
);
