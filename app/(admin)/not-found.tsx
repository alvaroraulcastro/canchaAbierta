import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold">No encontrado</h1>
      <p className="text-sm text-muted">
        Esa página del panel admin no existe.
      </p>
      <Link href="/admin" className="text-sm text-link hover:underline">
        Volver al panel
      </Link>
    </main>
  );
}
