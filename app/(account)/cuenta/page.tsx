import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Tu cuenta",
};

const links = [
  {
    href: "/cuenta/perfil",
    label: "Perfil de jugador",
    description: "Nombre, teléfono y preferencias antes de inscribirte.",
  },
  {
    href: "/cuenta/mis-inscripciones",
    label: "Mis inscripciones",
    description: "Estados de pago, cancelaciones y detalle de cada partido.",
  },
  {
    href: "/cuenta/integraciones",
    label: "Integraciones",
    description: "Google Calendar y otras conexiones opcionales.",
  },
  {
    href: "/cuenta/notificaciones",
    label: "Notificaciones",
    description: "Avisos dentro de la plataforma.",
  },
] as const;

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/cuenta");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <PageHeader
        title="Tu cuenta"
        description={`Sesión iniciada como ${session.user.name ?? session.user.email}.`}
      />

      {session.user.isAdmin ? (
        <Link
          href="/admin"
          className="inline-flex w-fit rounded-2xl border border-brand-400/50 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Ir al panel admin →
        </Link>
      ) : null}

      <nav aria-label="Secciones de cuenta" className="flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-3xl border border-line bg-card px-5 py-4 shadow-sm shadow-brand-900/5 transition hover:border-brand-400 hover:bg-brand-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-semibold text-ink group-hover:text-brand-900">{link.label}</span>
              <span className="text-muted transition group-hover:translate-x-0.5" aria-hidden>
                →
              </span>
            </span>
            <span className="mt-1 block text-sm text-muted">{link.description}</span>
          </Link>
        ))}
      </nav>

      <p className="text-sm text-muted">
        ¿Primera vez? Lee la{" "}
        <Link href="/ayuda" className="text-link underline-offset-4 hover:underline">
          ayuda y preguntas frecuentes
        </Link>
        .
      </p>
    </main>
  );
}