"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">No pudimos cargar tu cuenta</h1>
      <p className="text-sm text-muted">{error.message}</p>
      <div className="flex gap-3">
        <Button type="button" onClick={reset} className="w-fit">
          Reintentar
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/cuenta/perfil">Ir a mi perfil</Link>
        </Button>
      </div>
    </main>
  );
}
