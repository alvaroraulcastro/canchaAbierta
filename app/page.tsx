import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Elige tu partido",
    body: "Filtra por deporte, fecha y complejo. Ves cupos y precio al instante.",
  },
  {
    title: "Inscríbete en minutos",
    body: "Entra con Google, completa tu perfil y paga en línea de forma segura.",
  },
  {
    title: "Llega a jugar",
    body: "Recibe la confirmación y presenta tu QR el día del partido.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="overflow-hidden rounded-[2rem] border border-line bg-card shadow-sm">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src="/images/hero-cancha-split.jpg"
            alt="Cancha de baby fútbol a la izquierda y cancha de pádel a la derecha"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/75 via-brand-950/25 to-transparent"
            aria-hidden
          />
        </div>
        <div className="px-6 py-10 sm:px-10">
          <p className="inline-flex rounded-full bg-brand-300 px-3 py-1 text-xs font-semibold tracking-wide text-brand-950 uppercase">
            Chile · pádel y babyfútbol
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            Tu próximo partido, a un clic
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Encuentra canchas, suma cupo con otros jugadores y confirma tu lugar sin coordinar por
            WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/partidos">Ver partidos abiertos</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/canchas">Explorar canchas</Link>
            </Button>
          </div>
        </div>
      </header>

      <section aria-labelledby="deportes-heading" className="grid gap-4 sm:grid-cols-2">
        <h2 id="deportes-heading" className="sr-only">
          Elige tu deporte
        </h2>
        <Link
          href="/partidos?sport=padel"
          className="group rounded-3xl border border-line bg-card p-6 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <p className="text-sm font-semibold text-brand-700">Pádel</p>
          <h3 className="mt-2 text-xl font-semibold group-hover:text-brand-900">
            Partidos en cancha cubierta o al aire libre
          </h3>
          <p className="mt-2 text-sm text-muted">
            Horarios claros, precio por jugador y cupos en tiempo real.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-link">Ver partidos de pádel →</span>
        </Link>
        <Link
          href="/partidos?sport=babyfutbol"
          className="group rounded-3xl border border-line bg-brand-100 p-6 shadow-sm transition hover:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <p className="text-sm font-semibold text-brand-800">Babyfútbol</p>
          <h3 className="mt-2 text-xl font-semibold group-hover:text-brand-950">
            Arma el equipo y reserva la cancha
          </h3>
          <p className="mt-2 text-sm text-muted">
            Ideal para picados entre amigos o equipos que buscan reemplazo rápido.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-link">
            Ver partidos de babyfútbol →
          </span>
        </Link>
      </section>

      <section aria-labelledby="pasos-heading" className="rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 id="pasos-heading" className="text-xl font-semibold">
          Así funciona
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-full bg-brand-300 text-sm font-bold text-brand-950"
                aria-hidden
              >
                {index + 1}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="text-center text-sm text-muted sm:text-left">
        Horarios en hora de Chile · Pagos seguros en línea
      </footer>
    </main>
  );
}
