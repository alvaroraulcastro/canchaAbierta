import type { Metadata } from "next";
import { CourtCard } from "@/components/courts/court-card";
import { CourtFilters } from "@/components/courts/court-filters";
import { SheetsNotice } from "@/components/sheets-notice";
import { listCourtViews } from "@/lib/catalog";
import { sheetsConfigured } from "@/lib/sheets/client";
import { parseCourtsFilters, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Canchas",
  description: "Canchas de pádel y babyfútbol disponibles.",
};

export const revalidate = 60;

export default async function CourtsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseCourtsFilters(await searchParams);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Canchas</h1>
        <p className="text-muted">
          Elige una cancha de pádel o babyfútbol.
        </p>
      </header>
      <CourtFilters filters={filters} />
      <CourtsResults filters={filters} />
    </main>
  );
}

async function CourtsResults({ filters }: { filters: ReturnType<typeof parseCourtsFilters> }) {
  if (!sheetsConfigured()) return <SheetsNotice />;

  const courts = (await listCourtViews()).filter((court) => {
    if (!court.active) return false;
    if (filters.sport && court.sport !== filters.sport) return false;
    if (
      filters.q &&
      !court.name.toLocaleLowerCase("es-CL").includes(filters.q.toLocaleLowerCase("es-CL"))
    ) {
      return false;
    }
    return true;
  });

  if (courts.length === 0) {
    return (
      <p className="text-sm text-muted">
        No hay canchas con ese filtro.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {courts.map((court) => (
        <li key={court.id}>
          <CourtCard court={court} />
        </li>
      ))}
    </ul>
  );
}
