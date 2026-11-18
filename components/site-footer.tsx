import Link from "next/link";

const footerLinks = [
  { href: "/partidos", label: "Partidos" },
  { href: "/canchas", label: "Canchas" },
  { href: "/ayuda", label: "Ayuda" },
  { href: "/cuenta", label: "Tu cuenta" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-card/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-semibold text-ink">canchaAbierta</p>
            <p className="mt-2 text-sm text-muted">
              Inscripción y pago de partidos de pádel y babyfútbol en Chile. Horarios en hora de
              Santiago.
            </p>
          </div>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-ink underline-offset-4 hover:text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-muted">Pagos con Flow · Acceso con Google</p>
      </div>
    </footer>
  );
}