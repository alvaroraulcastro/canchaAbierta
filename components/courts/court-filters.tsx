import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CourtsFilters } from "@/lib/search-params";

export function CourtFilters({ filters }: { filters: CourtsFilters }) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      aria-label="Filtrar canchas"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Buscar
        <Input name="q" defaultValue={filters.q ?? ""} placeholder="Nombre de la cancha" />
      </label>
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
      <Button type="submit">Filtrar</Button>
    </form>
  );
}
