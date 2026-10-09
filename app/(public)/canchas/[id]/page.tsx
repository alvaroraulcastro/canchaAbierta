import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchCard } from "@/components/matches/match-card";
import { SheetsNotice } from "@/components/sheets-notice";
import { Badge } from "@/components/ui/badge";
import { getCourtView, listMatchViewsByCourt } from "@/lib/catalog";
import { formatCLP, sportLabel } from "@/lib/format";
import { parseRouteIdParams } from "@/lib/search-params";
import { sheetsConfigured } from "@/lib/sheets/client";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!sheetsConfigured()) return { title: "Cancha" };
  const court = await getCourtView(id);
  if (!court) return { title: "Cancha no encontrada" };
  return {
    title: court.name,
    description: `${sportLabel(court.sport)} en ${court.venueName}`,
  };
}

export default async function CourtPage({ params }: { params: Promise<{ id: string }> }) {
  const rawParams = await params;
  const parsed = parseRouteIdParams(rawParams);
  if (!parsed) notFound();
  const id = parsed.id;
  if (!sheetsConfigured()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <SheetsNotice />
      </main>
    );
  }

  const court = await getCourtView(id);
  if (!court || !court.active) notFound();

  const matches = (await listMatchViewsByCourt(court.id)).filter(
    (match) => match.status === "open" && Date.parse(match.dateTime) >= Date.now(),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <p className="text-sm">
        <Link href="/canchas" className="text-link hover:underline">
          Canchas
        </Link>
      </p>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{court.name}</h1>
          <Badge>{sportLabel(court.sport)}</Badge>
        </div>
        <p className="text-muted">
          {court.venueName}
          {court.venueAddress ? ` · ${court.venueAddress}` : ""}
        </p>
        <p>
          {formatCLP(court.priceCLP)} por jugador · {court.capacity} jugadores
        </p>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Próximos partidos</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-muted">
            No hay partidos abiertos en esta cancha.
          </p>
        ) : (
          <ul className="grid gap-4">
            {matches.map((match) => (
              <li key={match.id}>
                <MatchCard match={match} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
