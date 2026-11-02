import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connectGoogleCalendar, disconnectGoogleCalendar } from "@/lib/actions/connect-calendar";
import { auth } from "@/lib/auth/config";
import { getPlayer } from "@/lib/sheets/repos/players";
import { Button } from "@/components/ui/button";
import { parseIntegracionesSearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Integraciones",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IntegracionesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/cuenta/integraciones");

  const sp = parseIntegracionesSearchParams(await searchParams);
  const player = await getPlayer(session.user.email);
  const connected = Boolean(player?.calendarRefreshTokenEnc);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <p className="text-sm">
        <Link href="/cuenta" className="text-link hover:underline">
          Tu cuenta
        </Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Integraciones</h1>
      {sp.connectedNotice ? (
        <p className="rounded-xl border border-line bg-brand-50 px-4 py-3 text-sm" aria-live="polite">
          Google Calendar conectado. Tus próximos pagos crearán eventos automáticamente.
        </p>
      ) : null}
      {sp.disconnectedNotice ? (
        <p className="rounded-xl border border-line bg-brand-50 px-4 py-3 text-sm" aria-live="polite">
          Google Calendar desconectado.
        </p>
      ) : null}
      <section className="rounded-3xl border border-line bg-card p-6">
        <h2 className="text-lg font-semibold">Google Calendar</h2>
        <p className="mt-2 text-sm text-muted">
          Al pagar una inscripción, agregamos el partido a tu calendario principal.
        </p>
        <p className="mt-2 text-sm">{connected ? "Estado: conectado" : "Estado: no conectado"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {connected ? (
            <form action={disconnectGoogleCalendar}>
              <Button type="submit" variant="outline">
                Desconectar Calendar
              </Button>
            </form>
          ) : (
            <form action={connectGoogleCalendar}>
              <Button type="submit">Conectar Google Calendar</Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
