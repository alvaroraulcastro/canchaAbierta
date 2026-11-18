import Link from "next/link";
import { AuthMenu } from "@/components/auth-menu";

const links = [
  { href: "/canchas", label: "Canchas" },
  { href: "/partidos", label: "Partidos" },
  { href: "/ayuda", label: "Ayuda" },
] as const;

const navLinkClass =
  "inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 py-2 text-sm text-ink hover:bg-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-2xl font-semibold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          translate="no"
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-brand-300 text-sm font-bold text-brand-950">
            CA
          </span>
          <span className="truncate">canchaAbierta</span>
        </Link>
        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end sm:gap-3">
          <nav
            aria-label="Principal"
            className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-none [&::-webkit-scrollbar]:hidden"
          >
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
          </nav>
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}