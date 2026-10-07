import Link from "next/link";

const links = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/canchas", label: "Canchas" },
  { href: "/admin/partidos", label: "Partidos" },
  { href: "/admin/jugadores", label: "Jugadores" },
  { href: "/admin/auditoria", label: "Auditoría" },
] as const;

export function AdminNav() {
  return (
    <nav
      aria-label="Administración"
      className="flex flex-wrap gap-2 border-b border-line pb-4 text-sm"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-line bg-card px-3 py-1.5 font-medium hover:bg-brand-100"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
