import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { decideOverbook, markAttendance } from "@/lib/actions/admin/inscriptions";
import { getMatchView } from "@/lib/catalog";
import { listInscriptionsByMatch } from "@/lib/sheets/repos/inscriptions";
import { paymentStatusLabel } from "@/lib/format";
import { parseAdminOkSearchParams, parseRouteIdParams } from "@/lib/search-params";
import { formatMatchDateTime } from "@/lib/time";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Inscripciones del partido",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminMatchInscriptionsPage({ params, searchParams }: PageProps) {
  const rawParams = await params;
  const parsed = parseRouteIdParams(rawParams);
  if (!parsed) notFound();
  const id = parsed.id;
  const sp = parseAdminOkSearchParams(await searchParams);
  const match = await getMatchView(id);
  if (!match) notFound();

  const inscriptions = await listInscriptionsByMatch(id);

  return (
    <div className="flex flex-col gap-6">
      {sp.ok ? (
        <p className="rounded-xl bg-brand-100 px-3 py-2 text-sm text-brand-950">Actualizado.</p>
      ) : null}
      <div>
        <h2 className="text-xl font-semibold">{match.courtName}</h2>
        <p className="text-sm text-muted">
          {formatMatchDateTime(match.dateTime)} · {match.venueName}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {inscriptions.length === 0 ? (
          <li className="text-sm text-muted">Sin inscripciones aún.</li>
        ) : (
          inscriptions.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{row.playerEmail}</p>
                <p className="text-sm text-muted">
                  {paymentStatusLabel(row.paymentStatus)}
                  {row.overbookRequested ? " · sobrecupo" : ""}
                  {row.adminApproved === true ? " · aprobado" : ""}
                  {row.adminApproved === false ? " · rechazado" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.overbookRequested && row.paymentStatus === "paid" && row.adminApproved === null ? (
                  <>
                    <form action={decideOverbook}>
                      <input type="hidden" name="inscriptionId" value={row.id} />
                      <input type="hidden" name="matchId" value={id} />
                      <input type="hidden" name="approved" value="true" />
                      <Button type="submit" size="sm">Aprobar sobrecupo</Button>
                    </form>
                    <form action={decideOverbook}>
                      <input type="hidden" name="inscriptionId" value={row.id} />
                      <input type="hidden" name="matchId" value={id} />
                      <input type="hidden" name="approved" value="false" />
                      <Button type="submit" variant="outline" size="sm">Rechazar</Button>
                    </form>
                  </>
                ) : null}
                {row.paymentStatus === "paid" ? (
                  <form action={markAttendance}>
                    <input type="hidden" name="inscriptionId" value={row.id} />
                    <input type="hidden" name="matchId" value={id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Registrar asistencia
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
