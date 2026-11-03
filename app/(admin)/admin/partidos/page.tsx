import type { Metadata } from "next";
import Link from "next/link";
import { createMatch, setMatchStatus } from "@/lib/actions/admin/matches";
import { listMatchViews } from "@/lib/catalog";
import { AdminFormAlerts } from "@/components/admin/admin-form-alerts";
import { filterVenueIdsForAdmin } from "@/lib/auth/permissions";
import { getAdminSession } from "@/lib/auth/require-admin";
import { listCourts } from "@/lib/sheets/repos/courts";
import { formatCLP, matchStatusLabel, sportLabel, spotsLabel } from "@/lib/format";
import { parseAdminOkSearchParams, type SearchParams } from "@/lib/search-params";
import { formatMatchDateTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Partidos",
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminMatchesPage({ searchParams }: PageProps) {
  const sp = parseAdminOkSearchParams(await searchParams);
  const admin = await getAdminSession();
  if (!admin) return null;

  const [matches, courts] = await Promise.all([listMatchViews(), listCourts()]);
  const allowedVenueIds = new Set(
    filterVenueIdsForAdmin(
      admin,
      matches.map((match) => match.venueId),
    ),
  );
  const activeCourts = courts.filter(
    (court) => court.active && allowedVenueIds.has(court.venueId),
  );
  const visibleMatches = matches.filter((match) => allowedVenueIds.has(match.venueId));

  return (
    <div className="flex flex-col gap-8">
      <AdminFormAlerts ok={sp.ok} error={sp.error} />

      <Card>
        <CardHeader>
          <CardTitle>Nuevo partido</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMatch} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Cancha
              <select
                name="courtId"
                required
                className="h-10 rounded-xl border border-line bg-card px-3 text-sm"
                defaultValue={activeCourts[0]?.id ?? ""}
              >
                {activeCourts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} ({sportLabel(court.sport)}) — {formatCLP(court.priceCLP)} arriendo
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fecha y hora (Chile)
              <Input name="dateTimeLocal" type="datetime-local" required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Duración (min)
                <Input name="durationMin" type="number" min={30} defaultValue={90} required />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Cupos máximos
                <Input name="maxPlayers" type="number" min={2} defaultValue={4} required />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="allowOverbook" className="size-4 rounded border-line" />
              Permitir sobrecupo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="requiresExtraConfirmation"
                className="size-4 rounded border-line"
              />
              Requiere confirmación extra (sobrecupo)
            </label>
            <p className="text-xs text-muted">
              Precio por jugador = arriendo de la cancha ÷ cupos máximos del partido.
            </p>
            <Button type="submit" disabled={activeCourts.length === 0}>
              Publicar partido
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Partidos</h2>
        <ul className="flex flex-col gap-3">
          {visibleMatches.map((match) => (
            <li key={match.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{match.courtName}</p>
                  <p className="text-sm text-muted">
                    {formatMatchDateTime(match.dateTime)} · {match.venueName}
                  </p>
                  <p className="text-sm">
                    {matchStatusLabel(match.status)} · {spotsLabel(match.currentPlayers, match.maxPlayers)} ·{" "}
                    {formatCLP(match.priceCLP)} c/u ({formatCLP(match.courtTotalPriceCLP)} arriendo)
                  </p>
                </div>
                <Link
                  href={`/admin/partidos/${encodeURIComponent(match.id)}/inscripciones`}
                  className="text-sm font-medium text-brand-800 hover:underline"
                >
                  Inscripciones
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {match.status === "open" ? (
                  <>
                    <form action={setMatchStatus}>
                      <input type="hidden" name="matchId" value={match.id} />
                      <input type="hidden" name="status" value="closed" />
                      <Button type="submit" variant="outline" size="sm">
                        Cerrar
                      </Button>
                    </form>
                    <form action={setMatchStatus}>
                      <input type="hidden" name="matchId" value={match.id} />
                      <input type="hidden" name="status" value="cancelled" />
                      <Button type="submit" variant="outline" size="sm">
                        Cancelar
                      </Button>
                    </form>
                  </>
                ) : null}
                {match.status === "closed" ? (
                  <form action={setMatchStatus}>
                    <input type="hidden" name="matchId" value={match.id} />
                    <input type="hidden" name="status" value="completed" />
                    <Button type="submit" variant="outline" size="sm">
                      Marcar finalizado
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
