import { inscribirse } from "@/lib/actions/inscribirse";
import { Button } from "@/components/ui/button";

export function InscribirseForm({ matchId, disabled }: { matchId: string; disabled?: boolean }) {
  return (
    <form action={inscribirse} aria-label="Inscribirse al partido y pagar">
      <input type="hidden" name="matchId" value={matchId} />
      <Button type="submit" disabled={disabled}>
        Inscribirme y pagar
      </Button>
    </form>
  );
}
