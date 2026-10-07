import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { auth } from "@/lib/auth/config";
import { getPlayer } from "@/lib/sheets/repos/players";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/cuenta/perfil");
  const params = await searchParams;
  const player = await getPlayer(session.user.email);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <p className="text-sm">
        <Link href="/cuenta" className="text-link hover:underline">
          Tu cuenta
        </Link>
      </p>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Perfil de jugador</h1>
        <p className="text-muted">{session.user.email}</p>
        {params.callbackUrl ? (
          <p className="text-sm text-muted">
            Completa tu perfil para continuar con la inscripción.
          </p>
        ) : null}
      </header>
      <ProfileForm player={player} />
    </main>
  );
}
