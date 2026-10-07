import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Tu cuenta",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/cuenta");

  const links = [
    { href: "/cuenta/perfil", label: "Perfil de jugador" },
    { href: "/cuenta/mis-inscripciones", label: "Mis inscripciones" },
    { href: "/cuenta/notificaciones", label: "Notificaciones" },
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Tu cuenta</h1>
      <p>{session.user.name}</p>
      <p className="text-muted">{session.user.email}</p>
      {session.user.isAdmin ? (
        <Link
          href="/admin"
          className="text-sm font-medium text-brand-800 hover:underline"
        >
          Ir al panel admin
        </Link>
      ) : null}
      <nav aria-label="Cuenta" className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-line bg-card px-4 py-3 text-sm font-medium hover:bg-brand-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
