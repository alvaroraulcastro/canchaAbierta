import Link from "next/link";

const links = [
  { href: "/canchas", label: "Canchas" },
  { href: "/partidos", label: "Partidos" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-brand-700 text-sm font-semibold tracking-wide uppercase">
          canchaAbierta
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
