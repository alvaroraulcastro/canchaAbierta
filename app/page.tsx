export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
          canchaAbierta
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Encuentra tu partido de pádel o babyfútbol
        </h1>
        <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
          Inscríbete, paga en línea con Flow y juega. Estamos recién partiendo — pronto verás aquí
          las canchas y partidos disponibles.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-semibold">¿Eres jugador?</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Entra con tu cuenta de Google, completa tu perfil y elige un partido.
          </p>
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-semibold">¿Administras canchas?</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Crea canchas y partidos, gestiona inscripciones y aprueba sobrecupos.
          </p>
        </article>
      </section>

      <footer className="mt-auto pt-12 text-sm text-neutral-500">
        Hecho con Next.js · Datos en Google Sheets · Pagos con Flow.cl
      </footer>
    </main>
  );
}
