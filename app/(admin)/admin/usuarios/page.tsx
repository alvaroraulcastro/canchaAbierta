import { deactivateAdminUser, saveAdminUser } from "@/lib/actions/admin/users";
import { listVenues } from "@/lib/sheets/repos/venues";
import { listAdminUsers } from "@/lib/sheets/repos/admin-users";
import { parseVenueIdsCsv, ADMIN_ROLE_VALUES, type AdminRole } from "@/lib/sheets/schemas";
import { requireAdminPermission } from "@/lib/auth/require-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseAdminOkSearchParams } from "@/lib/search-params";

const roleLabels: Record<AdminRole, string> = {
  super_admin: "Super admin",
  venue_admin: "Admin de complejo",
  support: "Soporte",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminPermission("admin_users");
  const sp = parseAdminOkSearchParams(await searchParams);
  const [users, venues] = await Promise.all([listAdminUsers(), listVenues()]);

  return (
    <div className="flex flex-col gap-6">
      {sp.ok ? (
        <p className="rounded-xl bg-brand-100 px-3 py-2 text-sm text-brand-950">Actualizado.</p>
      ) : null}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">Nuevo usuario admin</h2>
        <form action={saveAdminUser} className="mt-4 flex max-w-lg flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <Input name="email" type="email" required autoComplete="off" spellCheck={false} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Rol
            <select name="role" className="field w-full" defaultValue="venue_admin">
              {ADMIN_ROLE_VALUES.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Complejos (CSV de IDs, solo venue-admin)
            <Input name="venueIds" placeholder="venue-ejemplo, otro-venue" autoComplete="off" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" value="on" defaultChecked className="size-4" />
            Activo
          </label>
          <Button type="submit" className="w-fit">
            Guardar usuario
          </Button>
        </form>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Usuarios</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {users.length === 0 ? (
            <li className="text-sm text-muted">No hay filas en AdminUsers. Usa ALLOWED_ADMIN_EMAILS como respaldo temporal.</li>
          ) : (
            users.map((user) => (
              <li key={user.email} className="rounded-2xl border border-line bg-card p-4">
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted">
                  {roleLabels[user.role]}
                  {user.role === "venue_admin"
                    ? ` · ${parseVenueIdsCsv(user.venueIds).join(", ") || "sin venues"}`
                    : ""}
                  {user.active ? "" : " · inactivo"}
                </p>
                {user.active ? (
                  <form action={deactivateAdminUser} className="mt-2">
                    <input type="hidden" name="email" value={user.email} />
                    <Button type="submit" variant="outline" size="sm">
                      Desactivar
                    </Button>
                  </form>
                ) : null}
              </li>
            ))
          )}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Complejos disponibles: {venues.map((v) => v.id).join(", ") || "ninguno"}
        </p>
      </section>
    </div>
  );
}
