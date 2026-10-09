import type { Metadata } from "next";
import Link from "next/link";
import { deleteCourt, saveCourt } from "@/lib/actions/admin/courts";
import { listCourtViews } from "@/lib/catalog";
import { listVenues } from "@/lib/sheets/repos/venues";
import { getCourt } from "@/lib/sheets/repos/courts";
import { formatCLP, sportLabel } from "@/lib/format";
import { parseAdminCourtsSearchParams, type SearchParams } from "@/lib/search-params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Canchas",
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminCourtsPage({ searchParams }: PageProps) {
  const sp = parseAdminCourtsSearchParams(await searchParams);
  const [courts, venues, editing] = await Promise.all([
    listCourtViews(),
    listVenues(),
    sp.edit ? getCourt(sp.edit) : Promise.resolve(null),
  ]);

  const activeVenues = venues.filter((venue) => venue.active);

  return (
    <div className="flex flex-col gap-8">
      {sp.ok ? (
        <p className="rounded-xl bg-brand-100 px-3 py-2 text-sm text-brand-950">Cambios guardados.</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar cancha" : "Nueva cancha"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveCourt} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              ID (slug)
              <Input name="id" required defaultValue={editing?.id ?? ""} readOnly={Boolean(editing)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Complejo
              <select
                name="venueId"
                required
                defaultValue={editing?.venueId ?? activeVenues[0]?.id ?? ""}
                className="h-10 rounded-xl border border-line bg-card px-3 text-sm"
              >
                {activeVenues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Nombre
              <Input name="name" required defaultValue={editing?.name ?? ""} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Deporte
              <select
                name="sport"
                defaultValue={editing?.sport ?? "padel"}
                className="h-10 rounded-xl border border-line bg-card px-3 text-sm"
              >
                <option value="padel">Pádel</option>
                <option value="babyfutbol">Babyfútbol</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Cupos
                <Input
                  name="capacity"
                  type="number"
                  min={2}
                  required
                  defaultValue={editing?.capacity ?? 4}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Precio CLP
                <Input
                  name="priceCLP"
                  type="number"
                  min={0}
                  required
                  defaultValue={editing?.priceCLP ?? 10000}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Foto (URL)
              <Input name="photoUrl" type="url" defaultValue={editing?.photoUrl ?? ""} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={editing?.active ?? true}
                className="size-4 rounded border-line"
              />
              Activa
            </label>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear cancha"}</Button>
            {editing ? (
              <Link href="/admin/canchas" className="text-center text-sm text-muted hover:underline">
                Cancelar edición
              </Link>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Canchas registradas</h2>
        <ul className="flex flex-col gap-2">
          {courts.map((court) => (
            <li
              key={court.id}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{court.name}</p>
                <p className="text-sm text-muted">
                  {court.id} · {court.venueName} · {sportLabel(court.sport)} · {formatCLP(court.priceCLP)}
                </p>
                <p className="text-sm">{court.active ? "Activa" : "Inactiva"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/canchas?edit=${encodeURIComponent(court.id)}`}
                  className="rounded-full border border-line px-3 py-1.5 text-sm font-medium hover:bg-brand-100"
                >
                  Editar
                </Link>
                {court.active ? (
                  <form action={deleteCourt}>
                    <input type="hidden" name="id" value={court.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Desactivar
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
