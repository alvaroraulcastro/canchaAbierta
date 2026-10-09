import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Página no encontrada</h1>
      <p className="max-w-md text-sm text-muted">
        La página que buscas no existe o fue movida.
      </p>
      <Link href="/partidos" className="text-sm text-link font-medium hover:underline">
        Ver partidos
      </Link>
    </main>
  );
}
