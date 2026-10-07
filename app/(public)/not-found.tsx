import Link from "next/link";

export default function PublicNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold">No encontrado</h1>
      <p className="text-sm text-muted">
        Esa cancha o partido no está disponible.
      </p>
      <Link href="/partidos" className="text-sm text-link hover:underline">
        Ver partidos
      </Link>
    </main>
  );
}
