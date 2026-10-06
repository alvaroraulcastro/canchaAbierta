import Link from "next/link";

export default function PublicNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold">No encontrado</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Esa cancha o partido no está disponible.
      </p>
      <Link href="/partidos" className="text-brand-700 text-sm hover:underline">
        Ver partidos
      </Link>
    </main>
  );
}
