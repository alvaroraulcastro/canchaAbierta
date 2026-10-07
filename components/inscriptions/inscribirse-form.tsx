import { inscribirse } from "@/lib/actions/inscribirse";
import { Button } from "@/components/ui/button";

export function InscribirseForm({ matchId, disabled }: { matchId: string; disabled?: boolean }) {
  return (
    <form action={inscribirse}>
      <input type="hidden" name="matchId" value={matchId} />
      <Button type="submit" disabled={disabled}>
        Inscribirme y pagar
      </Button>
    </form>
  );
}
