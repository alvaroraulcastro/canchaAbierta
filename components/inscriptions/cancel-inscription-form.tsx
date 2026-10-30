"use client";

import { useRef } from "react";
import { cancelInscription } from "@/lib/actions/cancel-inscription";
import { Button } from "@/components/ui/button";

export function CancelInscriptionForm({ inscriptionId }: { inscriptionId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={() => dialogRef.current?.showModal()}
      >
        Cancelar inscripción
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="cancel-inscription-title"
        aria-describedby="cancel-inscription-desc"
        className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-md overscroll-contain rounded-3xl border border-line bg-card p-6 text-ink shadow-lg backdrop:bg-brand-950/50 open:flex open:flex-col open:gap-4"
      >
        <form action={cancelInscription} className="flex flex-col gap-4">
          <div>
            <h2 id="cancel-inscription-title" className="text-lg font-semibold text-balance">
              ¿Cancelar inscripción?
            </h2>
            <p id="cancel-inscription-desc" className="mt-2 text-sm text-muted">
              Se libera tu cupo en el partido. No hay reembolso automático por Flow; si necesitas
              devolución, contacta al administrador.
            </p>
          </div>
          <input type="hidden" name="inscriptionId" value={inscriptionId} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => dialogRef.current?.close()}>
              Volver
            </Button>
            <Button type="submit" variant="destructive">
              Sí, cancelar
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
