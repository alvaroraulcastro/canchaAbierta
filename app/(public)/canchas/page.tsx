import type { Metadata } from "next";
import { CourtCard } from "@/components/courts/court-card";
import { CourtFilters } from "@/components/courts/court-filters";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <PageHeader
        title="Canchas"
        description="Complejos y canchas de pádel y babyfútbol. Desde cada ficha puedes ver partidos asociados."
      />
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
      <EmptyState
        title="No encontramos canchas"
        description="Ajusta la búsqueda o quita el filtro de deporte para ver todo el catálogo."
        actionHref="/partidos"
        actionLabel="Ir a partidos"
      />
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
