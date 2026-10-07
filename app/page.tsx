import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="overflow-hidden rounded-[2rem] border border-line bg-card px-6 py-10 shadow-sm sm:px-10">
        <p className="inline-flex rounded-full bg-brand-300 px-3 py-1 text-xs font-semibold tracking-wide text-brand-950 uppercase">
          Pádel y babyfútbol
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
          Encuentra tu partido y suma el cupo
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Revisa canchas, horarios y precio. Te inscribes y pagas en línea con Flow.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/partidos">Ver partidos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/canchas">Ver canchas</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-brand-700">Jugadores</p>
          <h2 className="mt-2 text-xl font-semibold">Elige un partido abierto</h2>
          <p className="mt-2 text-sm text-muted">
            Entra con Google, completa tu perfil y reserva tu cupo en pádel o babyfútbol.
          </p>
        </article>
        <article className="rounded-3xl border border-line bg-brand-100 p-6 shadow-sm">
          <p className="text-sm font-semibold text-brand-800">Canchas</p>
          <h2 className="mt-2 text-xl font-semibold">Publica y administra</h2>
          <p className="mt-2 text-sm text-muted">
            Crea partidos, sigue las inscripciones y aprueba el sobrecupo desde el panel.
          </p>
        </article>
      </section>

      <footer className="pt-4 text-sm text-muted">Pagos con Flow.cl · Horarios en hora de Chile</footer>
    </main>
  );
}
