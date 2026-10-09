"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-CL">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center antialiased">
        <h1 className="text-2xl font-semibold">Algo salió mal</h1>
        <p className="max-w-md text-sm text-muted">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        <div className="flex gap-3">
          <Button type="button" onClick={reset}>
            Reintentar
          </Button>
          <Button type="button" variant="outline" onClick={() => (window.location.href = "/")}>
            Ir al inicio
          </Button>
        </div>
      </body>
    </html>
  );
}
