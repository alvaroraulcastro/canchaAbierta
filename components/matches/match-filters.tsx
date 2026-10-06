import { Button } from "@/components/ui/button";
import type { MatchesFilters } from "@/lib/search-params";

export function MatchFilters({ filters }: { filters: MatchesFilters }) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      aria-label="Filtrar partidos"
    >
      <label className="flex flex-col gap-1 text-sm">
        Deporte
        <select
          name="sport"
          defaultValue={filters.sport ?? ""}
          className="h-10 rounded-full border border-neutral-300 bg-white px-4 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Todos</option>
          <option value="padel">Pádel</option>
          <option value="babyfutbol">Babyfútbol</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Fecha
        <select
          name="cuando"
          defaultValue={filters.cuando}
          className="h-10 rounded-full border border-neutral-300 bg-white px-4 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="proximos">Próximos</option>
          <option value="todos">Todos</option>
        </select>
      </label>
      <Button type="submit">Filtrar</Button>
    </form>
  );
}
