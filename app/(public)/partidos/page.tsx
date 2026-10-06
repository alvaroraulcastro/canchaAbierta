import type { Metadata } from "next";
import { MatchCard } from "@/components/matches/match-card";
import { MatchFilters } from "@/components/matches/match-filters";
import { SheetsNotice } from "@/components/sheets-notice";
import { listMatchViews } from "@/lib/catalog";
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Partidos</h1>
        <p className="text-muted">
          Revisa cupos, horario y precio antes de inscribirte.
        </p>
      </header>
      <MatchFilters filters={filters} />
      <MatchesResults filters={filters} />
    </main>
  );
}

async function MatchesResults({ filters }: { filters: ReturnType<typeof parseMatchesFilters> }) {
  if (!sheetsConfigured()) return <SheetsNotice />;

  const now = Date.now();
  const matches = (await listMatchViews()).filter((match) => {
    if (filters.sport && match.sport !== filters.sport) return false;
    if (filters.cuando === "proximos") {
      return match.status === "open" && Date.parse(match.dateTime) >= now;
    }
    return true;
  });

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted">
        No hay partidos con ese filtro.
      </p>
    );
  }

  return (
    <ul className="grid gap-4">
      {matches.map((match) => (
        <li key={match.id}>
          <MatchCard match={match} />
        </li>
      ))}
    </ul>
  );
}
