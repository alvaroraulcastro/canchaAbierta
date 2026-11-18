import type { Metadata } from "next";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { MatchCard } from "@/components/matches/match-card";
import { MatchFilters } from "@/components/matches/match-filters";
import { SheetsNotice } from "@/components/sheets-notice";
import { listMatchViews } from "@/lib/catalog";
import { isMatchVisibleInPublicList } from "@/lib/matches/public-list";
import { sheetsConfigured } from "@/lib/sheets/client";
import { parseMatchesFilters, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Partidos",
  description: "Partidos de pádel y babyfútbol con cupos y precio.",
};

export const revalidate = 60;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseMatchesFilters(await searchParams);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <PageHeader
        title="Partidos"
        description="Revisa cupos, horario y precio por jugador. Los encuentros cerrados o completos siguen visibles para consulta."
      />
      <MatchFilters filters={filters} />
      <MatchesResults filters={filters} />
    </main>
  );
}

async function MatchesResults({ filters }: { filters: ReturnType<typeof parseMatchesFilters> }) {
  if (!sheetsConfigured()) return <SheetsNotice />;

  const matches = (await listMatchViews()).filter((match) =>
    isMatchVisibleInPublicList(match, filters),
  );

  if (matches.length === 0) {
    return (
      <EmptyState
        title="No hay partidos con este filtro"
        description="Prueba con otro deporte, elige «Todos» en la fecha o vuelve más tarde cuando publiquen nuevos horarios."
        actionHref="/ayuda"
        actionLabel="Ver preguntas frecuentes"
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {matches.map((match) => (
        <li key={match.id}>
          <MatchCard match={match} />
        </li>
      ))}
    </ul>
  );
}
