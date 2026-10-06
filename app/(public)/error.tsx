"use client";

import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">No pudimos cargar los datos</h1>
      <p className="text-sm text-muted">{error.message}</p>
      <Button type="button" onClick={reset} className="w-fit">
        Reintentar
      </Button>
    </main>
  );
}
