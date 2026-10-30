import { revalidateTag } from "next/cache";
import { confirmFlowPayment } from "@/lib/flow/confirm-payment";
import { createLogger } from "@/lib/logger";
import { listInscriptionsByPlayer } from "@/lib/sheets/repos/inscriptions";
import { inscriptionsTag, matchTag, SHEET_TAGS } from "@/lib/sheets/tags";

const logger = createLogger("flow/sync-pending");
const STALE_PENDING_MS = 5 * 60 * 1000;

export async function syncStalePendingInscriptionsForPlayer(playerEmail: string): Promise<void> {
  const inscriptions = await listInscriptionsByPlayer(playerEmail);
  const now = Date.now();

  for (const row of inscriptions) {
    if (row.paymentStatus !== "pending") continue;
    const token = row.flowToken?.trim();
    if (!token) continue;
    const updatedAt = Date.parse(row.updatedAt);
    if (Number.isNaN(updatedAt) || now - updatedAt < STALE_PENDING_MS) continue;

    try {
      const result = await confirmFlowPayment(token);
      if ("missing" in result) continue;
      if (!result.changed) continue;
      revalidateTag(SHEET_TAGS.Inscripciones);
      revalidateTag(SHEET_TAGS.Partidos);
      revalidateTag(SHEET_TAGS.Notificaciones);
      revalidateTag(inscriptionsTag(result.matchId));
      revalidateTag(matchTag(result.matchId));
    } catch (error) {
      logger.error("No se pudo sincronizar inscripción pendiente con Flow", error, {
        inscriptionId: row.id,
      });
    }
  }
}
