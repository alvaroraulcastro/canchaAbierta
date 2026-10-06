import Link from "next/link";

const links = [
  { href: "/canchas", label: "Canchas" },
  { href: "/partidos", label: "Partidos" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-ink">
          <span className="grid size-9 place-items-center rounded-2xl bg-brand-300 text-sm font-bold text-brand-950">
            CA
          </span>
          canchaAbierta
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-ink hover:bg-brand-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
