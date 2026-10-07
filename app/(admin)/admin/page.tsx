import Link from "next/link";

const shortcuts = [
  {
    href: "/admin/canchas",
    title: "Canchas",
    description: "Crear, editar y desactivar canchas en el Sheets.",
  },
  {
    href: "/admin/partidos",
    title: "Partidos",
    description: "Publicar partidos, cerrar o cancelar con aviso a jugadores.",
  },
  {
    href: "/admin/jugadores",
    title: "Jugadores",
    description: "Listado de perfiles registrados (solo lectura).",
  },
  {
    href: "/admin/auditoria",
    title: "Auditoría",
    description: "Historial de cambios hechos desde el panel.",
  },
] as const;

export default function AdminHomePage() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {shortcuts.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-2xl border border-line bg-card p-4 hover:bg-brand-50"
        >
          <h2 className="font-semibold">{item.title}</h2>
          <p className="mt-1 text-sm text-muted">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
