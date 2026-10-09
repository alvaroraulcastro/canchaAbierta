import Link from "next/link";

export default function AccountNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold">No encontrado</h1>
      <p className="text-sm text-muted">
        Esa página de tu cuenta no existe.
      </p>
      <Link href="/cuenta/perfil" className="text-sm text-link hover:underline">
        Ir a mi perfil
      </Link>
    </main>
  );
}
