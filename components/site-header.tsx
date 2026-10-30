import Link from "next/link";
import { AuthMenu } from "@/components/auth-menu";

const links = [
  { href: "/canchas", label: "Canchas" },
  { href: "/partidos", label: "Partidos" },
] as const;

const navLinkClass =
  "rounded-full px-3 py-1.5 text-ink hover:bg-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-2">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-2xl"
          translate="no"
        >
          <span className="grid size-9 place-items-center rounded-2xl bg-brand-300 text-sm font-bold text-brand-950">
            CA
          </span>
          canchaAbierta
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
