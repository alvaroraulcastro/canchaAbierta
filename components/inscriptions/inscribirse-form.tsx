"use client";

import { useFormStatus } from "react-dom";
import { inscribirse } from "@/lib/actions/inscribirse";
import { Button } from "@/components/ui/button";

function InscribirseSubmit({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Redirigiendo…" : "Inscribirme y pagar"}
    </Button>
  );
}

export function InscribirseForm({ matchId, disabled }: { matchId: string; disabled?: boolean }) {
  return (
    <form action={inscribirse} aria-label="Inscribirse al partido y pagar">
      <input type="hidden" name="matchId" value={matchId} />
      <InscribirseSubmit disabled={disabled} />
    </form>
  );
}
