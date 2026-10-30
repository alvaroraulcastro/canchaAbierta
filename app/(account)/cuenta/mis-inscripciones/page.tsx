import { CancelInscriptionForm } from "@/components/inscriptions/cancel-inscription-form";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { listMatchViews } from "@/lib/catalog";
import { syncStalePendingInscriptionsForPlayer } from "@/lib/flow/sync-pending-inscriptions";
import { formatCLP } from "@/lib/format";
import { auth } from "@/lib/auth/config";
import { canPlayerCancelInscription } from "@/lib/inscriptions/cancel-policy";
import { listInscriptionsByPlayer } from "@/lib/sheets/repos/inscriptions";
import { parseInscriptionsSearchParams, type SearchParams } from "@/lib/search-params";
import { formatMatchDateTime } from "@/lib/time";
import { matchHref } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Mis inscripciones",
};

const statusLabel: Record<string, string> = {
  pending: "Pago pendiente",
  paid: "Pagada",
  failed: "Rechazada",
  refunded: "Reembolsada",
  cancelled: "Cancelada",
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function MyInscriptionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/cuenta/mis-inscripciones");

  const sp = parseInscriptionsSearchParams(await searchParams);
  await syncStalePendingInscriptionsForPlayer(session.user.email);

  const [inscriptions, matches] = await Promise.all([
    listInscriptionsByPlayer(session.user.email),
    listMatchViews(),
  ]);
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const sorted = [...inscriptions].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <p className="text-sm">
        <Link href="/cuenta" className="text-link hover:underline">
          Tu cuenta
        </Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Mis inscripciones</h1>
      {(sp.showPendingNotice || sp.showCancelledNotice || sp.cancelError) ? (
        <div aria-live="polite" className="flex flex-col gap-3">
          {sp.showPendingNotice ? (
            <p className="rounded-xl border border-line bg-brand-50 px-4 py-3 text-sm">
              Tu pago quedó pendiente. Si ya pagaste en Flow, espera unos minutos o recarga esta
              página para sincronizar el estado.
            </p>
          ) : null}
          {sp.showCancelledNotice ? (
            <p className="rounded-xl border border-line bg-brand-50 px-4 py-3 text-sm">
              Tu inscripción fue cancelada. El cupo quedó liberado en el partido.
            </p>
          ) : null}
          {sp.cancelError ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {sp.cancelError}
            </p>
          ) : null}
        </div>
      ) : null}
      {sorted.length === 0 ? (
        <p className="text-muted">
          Aún no tienes inscripciones.{" "}
          <Link href="/partidos" className="text-link hover:underline">
            Ver partidos
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((inscription) => {
            const match = matchById.get(inscription.matchId);
            const cancelPolicy =
              match && inscription.paymentStatus === "paid"
                ? canPlayerCancelInscription(match, inscription)
                : null;
            return (
              <li
                key={inscription.id}
                className="rounded-3xl border border-line bg-card p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {match?.courtName ?? inscription.matchId}
                  </h2>
                  <Badge variant="outline">
                    {statusLabel[inscription.paymentStatus] ?? inscription.paymentStatus}
                  </Badge>
                  {inscription.overbookRequested ? (
                    <Badge variant="muted">Sobrecupo</Badge>
                  ) : null}
                </div>
                {match ? (
                  <p className="mt-1 text-sm text-muted">
                    {formatMatchDateTime(match.dateTime)} · {match.venueName}
                  </p>
                ) : null}
                <p className="mt-2 text-sm">{formatCLP(inscription.amountCLP)}</p>
                {match ? (
                  <Link
                    href={matchHref(match.id)}
                    className="mt-3 inline-block text-sm text-link hover:underline"
                  >
                    Ver partido
                  </Link>
                ) : null}
                {cancelPolicy?.ok ? (
                  <CancelInscriptionForm inscriptionId={inscription.id} />
                ) : null}
                {cancelPolicy && !cancelPolicy.ok ? (
                  <p className="mt-3 text-sm text-muted">{cancelPolicy.error}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
