import Link from "next/link";
import { requireAdminPermission } from "@/lib/auth/require-admin";
import { filterVenueIdsForAdmin } from "@/lib/auth/permissions";
import { getAnalyticsDashboard } from "@/lib/analytics/dashboard";
import { formatCLP } from "@/lib/format";
import { listVenues } from "@/lib/sheets/repos/venues";
import {
  parseReportsSearchParams,
  reportsRangeMs,
  type SearchParams,
} from "@/lib/search-params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminReportesPage({ searchParams }: PageProps) {
  const admin = await requireAdminPermission("reports");
  const filters = parseReportsSearchParams(await searchParams);
  const { fromMs, toMs } = reportsRangeMs(filters.from, filters.to);
  const [venues, dashboard] = await Promise.all([
    listVenues(),
    getAnalyticsDashboard(admin, {
      venueId: filters.venueId,
      fromMs,
      toMs,
    }),
  ]);
  const allowedIds = filterVenueIdsForAdmin(
    admin,
    venues.map((v) => v.id),
  );
  const venueOptions = venues.filter((v) => allowedIds.includes(v.id));

  const exportQuery = new URLSearchParams({
    from: filters.from,
    to: filters.to,
  });
  if (filters.venueId) exportQuery.set("venueId", filters.venueId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Reportes</h2>
        <p className="text-sm text-muted">Agregados desde Inscripciones y Partidos (no reemplaza el Sheets).</p>
      </div>
      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          Desde
          <Input name="from" type="date" defaultValue={filters.from} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hasta
          <Input name="to" type="date" defaultValue={filters.to} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Complejo
          <select name="venueId" className="field min-w-48" defaultValue={filters.venueId ?? ""}>
            <option value="">Todos (permitidos)</option>
            {venueOptions.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">Aplicar</Button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-line bg-card p-4">
          <p className="text-sm text-muted">Ingresos (pagadas)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCLP(dashboard.paidRevenueCLP)}
          </p>
          <p className="text-sm text-muted">{dashboard.paidCount} inscripciones</p>
        </article>
        <article className="rounded-2xl border border-line bg-card p-4">
          <p className="text-sm text-muted">Check-ins</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{dashboard.checkedInCount}</p>
          <p className="text-sm text-muted">de {dashboard.paidCount} pagadas</p>
        </article>
        <article className="rounded-2xl border border-line bg-card p-4">
          <p className="text-sm text-muted">Cancelaciones</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{dashboard.cancelledCount}</p>
        </article>
        <article className="rounded-2xl border border-line bg-card p-4">
          <p className="text-sm text-muted">Ocupación media</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Math.round(dashboard.averageFillRate * 100)}%
          </p>
        </article>
      </div>
      <p className="text-sm text-muted">
        Sobrecupos pendientes de aprobación: {dashboard.pendingOverbookCount}
      </p>
      <Button asChild variant="outline" className="w-fit">
        <Link href={`/api/admin/reportes/export?${exportQuery.toString()}`}>Descargar CSV</Link>
      </Button>
    </div>
  );
}
