import { getAnalyticsDashboard } from "@/lib/analytics/dashboard";
import { requireAdminPermission } from "@/lib/auth/require-admin";
import { listInscriptions } from "@/lib/sheets/repos/inscriptions";
import { listMatchViews } from "@/lib/catalog";
import { filterVenueIdsForAdmin } from "@/lib/auth/permissions";
import {
  parseReportsSearchParams,
  reportsRangeMs,
} from "@/lib/search-params";

function csvEscape(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET(request: Request) {
  let admin;
  try {
    admin = await requireAdminPermission("reports");
  } catch {
    return new Response("No autorizado", { status: 401 });
  }
  const url = new URL(request.url);
  const filters = parseReportsSearchParams(Object.fromEntries(url.searchParams.entries()));
  const { fromMs, toMs } = reportsRangeMs(filters.from, filters.to);
  const dashboard = await getAnalyticsDashboard(admin, {
    venueId: filters.venueId,
    fromMs,
    toMs,
  });

  const [inscriptions, matches] = await Promise.all([listInscriptions(), listMatchViews()]);
  const allowedVenues = new Set(
    filterVenueIdsForAdmin(
      admin,
      matches.map((m) => m.venueId),
    ),
  );
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const lines = [
    "metric,value",
    `paid_count,${dashboard.paidCount}`,
    `paid_revenue_clp,${dashboard.paidRevenueCLP}`,
    `cancelled_count,${dashboard.cancelledCount}`,
    `checked_in_count,${dashboard.checkedInCount}`,
    `average_fill_rate,${dashboard.averageFillRate.toFixed(4)}`,
    "",
    "inscription_id,match_id,player_email,status,amount_clp,checked_in_at",
  ];

  for (const row of inscriptions) {
    const match = matchById.get(row.matchId);
    if (!match || !allowedVenues.has(match.venueId)) continue;
    if (filters.venueId && match.venueId !== filters.venueId) continue;
    const created = Date.parse(row.createdAt);
    if (created < fromMs || created > toMs) continue;
    lines.push(
      [
        csvEscape(row.id),
        csvEscape(row.matchId),
        csvEscape(row.playerEmail),
        csvEscape(row.paymentStatus),
        row.amountCLP,
        csvEscape(row.checkedInAt),
      ].join(","),
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reportes-${filters.from}-${filters.to}.csv"`,
    },
  });
}
