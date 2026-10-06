import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SheetsNotice } from "@/components/sheets-notice";
import { Badge } from "@/components/ui/badge";
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

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!sheetsConfigured()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <SheetsNotice />
      </main>
    );
  }

  const match = await getMatchView(id);
  if (!match) notFound();

  const spotsLeft = Math.max(0, match.maxPlayers - match.currentPlayers);
  const full = spotsLeft === 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <p className="text-sm">
        <Link href="/partidos" className="text-brand-700 hover:underline">
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
        <p className="text-neutral-600 dark:text-neutral-300">
          {match.venueName}
          {match.venueAddress ? ` · ${match.venueAddress}` : ""}
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-sm text-neutral-500">Precio</h2>
          <p className="mt-1 text-2xl font-semibold">{formatCLP(match.priceCLP)}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">por jugador</p>
        </article>
        <article className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-sm text-neutral-500">Cupos</h2>
          <p className="mt-1 text-2xl font-semibold">
            {spotsLabel(match.currentPlayers, match.maxPlayers)}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {full ? "Sin cupos libres" : `${spotsLeft} libres`}
          </p>
        </article>
        <article className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-sm text-neutral-500">Duración</h2>
          <p className="mt-1 text-2xl font-semibold">{match.durationMin} min</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            <Link href={courtHref(match.courtId)} className="text-brand-700 hover:underline">
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
    </main>
  );
}
