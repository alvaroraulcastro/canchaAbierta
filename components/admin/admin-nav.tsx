import Link from "next/link";
import { hasAdminPermission } from "@/lib/auth/permissions";
import type { ResolvedAdmin } from "@/lib/auth/resolve-admin";

const links = [
  { href: "/admin", label: "Resumen", permission: null },
  { href: "/admin/canchas", label: "Canchas", permission: "courts_write" as const },
  { href: "/admin/partidos", label: "Partidos", permission: "matches_write" as const },
  { href: "/admin/check-in", label: "Check-in QR", permission: "check_in" as const },
  { href: "/admin/reportes", label: "Reportes", permission: "reports" as const },
  { href: "/admin/jugadores", label: "Jugadores", permission: "reports" as const },
  { href: "/admin/auditoria", label: "Auditoría", permission: "audit_read" as const },
  { href: "/admin/usuarios", label: "Usuarios", permission: "admin_users" as const },
] as const;

const navLinkClass =
  "rounded-full border border-line bg-card px-3 py-1.5 font-medium hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function AdminNav({ admin }: { admin: ResolvedAdmin }) {
  return (
    <nav
      aria-label="Administración"
      className="flex flex-wrap gap-2 border-b border-line pb-4 text-sm"
    >
      {links.map((link) => {
        if (link.permission && !hasAdminPermission(admin, link.permission)) return null;
        return (
          <Link key={link.href} href={link.href} className={navLinkClass}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
