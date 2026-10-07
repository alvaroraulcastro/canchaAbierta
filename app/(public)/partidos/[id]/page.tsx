import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InscribirseForm } from "@/components/inscriptions/inscribirse-form";
import { SheetsNotice } from "@/components/sheets-notice";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth/config";
import { getMatchView } from "@/lib/catalog";
import { formatCLP, matchStatusLabel, spotsLabel, sportLabel } from "@/lib/format";
import { courtHref } from "@/lib/routes";
import { sheetsConfigured } from "@/lib/sheets/client";
import { formatMatchDateTime } from "@/lib/time";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!sheetsConfigured()) return { title: "Partido" };
  const match = await getMatchView(id);
  if (!match) return { title: "Partido no encontrado" };
  return {
    title: `${match.courtName} · ${formatMatchDateTime(match.dateTime)}`,
    description: `${sportLabel(match.sport)} en ${match.venueName}. ${formatCLP(match.priceCLP)} por jugador.`,
  };
}

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!sheetsConfigured()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <SheetsNotice />
      </main>
    );
  }

  const [match, session] = await Promise.all([getMatchView(id), auth()]);
  if (!match) notFound();

  const spotsLeft = Math.max(0, match.maxPlayers - match.currentPlayers);
  const full = spotsLeft === 0;
  const canInscribe =
    match.status === "open" && (!full || match.allowOverbook);
  const errorMessage =
    query.error === "cupo"
      ? "No quedan cupos disponibles en este partido."
      : query.error === "partido"
        ? "Este partido no acepta inscripciones."
        : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <p className="text-sm">
        <Link href="/partidos" className="text-link hover:underline">
          Partidos
        </Link>
      </p>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{match.courtName}</h1>
          <Badge>{sportLabel(match.sport)}</Badge>
          <Badge variant={match.status === "open" ? "outline" : "muted"}>
            {matchStatusLabel(match.status)}
          </Badge>
        </div>
        <p className="text-lg">{formatMatchDateTime(match.dateTime)}</p>
        <p className="text-muted">
          {match.venueName}
          {match.venueAddress ? ` · ${match.venueAddress}` : ""}
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-line bg-brand-100 p-5">
          <h2 className="text-sm text-muted">Precio</h2>
          <p className="mt-1 text-2xl font-semibold">{formatCLP(match.priceCLP)}</p>
          <p className="text-sm text-muted">por jugador</p>
        </article>
        <article className="rounded-3xl border border-line bg-card p-5">
          <h2 className="text-sm text-muted">Cupos</h2>
          <p className="mt-1 text-2xl font-semibold">
            {spotsLabel(match.currentPlayers, match.maxPlayers)}
          </p>
          <p className="text-sm text-muted">{full ? "Sin cupos libres" : `${spotsLeft} libres`}</p>
        </article>
        <article className="rounded-3xl border border-line bg-card p-5">
          <h2 className="text-sm text-muted">Duración</h2>
          <p className="mt-1 text-2xl font-semibold">{match.durationMin} min</p>
          <p className="text-sm text-muted">
            <Link href={courtHref(match.courtId)} className="text-link hover:underline">
              Ver cancha
            </Link>
          </p>
        </article>
      </section>
      {full && match.allowOverbook ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-50">
          El partido está lleno, pero acepta sobrecupo. El admin debe confirmarlo después del pago.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl border border-line bg-card p-4 text-sm" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {match.status === "open" ? (
        <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-6">
          <h2 className="text-lg font-semibold">Inscripción</h2>
          {!session?.user ? (
            <p className="text-sm text-muted">
              <Link
                href={`/auth/signin?callbackUrl=${encodeURIComponent(`/partidos/${id}`)}`}
                className="text-link font-medium hover:underline"
              >
                Inicia sesión con Google
              </Link>{" "}
              para inscribirte y pagar con Flow.
            </p>
          ) : canInscribe ? (
            <InscribirseForm matchId={id} />
          ) : (
            <p className="text-sm text-muted">No hay cupos disponibles.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
