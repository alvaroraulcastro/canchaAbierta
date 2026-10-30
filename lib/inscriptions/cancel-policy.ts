import type { MatchView } from "@/lib/catalog";
import type { Inscription } from "@/lib/sheets/schemas";

export const CANCEL_MIN_HOURS_BEFORE_MATCH = 24;

export type CancelPolicyResult = { ok: true } | { ok: false; error: string };

export function canPlayerCancelInscription(
  match: MatchView,
  inscription: Inscription,
  nowMs = Date.now(),
): CancelPolicyResult {
  if (inscription.paymentStatus !== "paid") {
    return { ok: false, error: "Solo puedes cancelar inscripciones pagadas" };
  }
  if (match.status !== "open") {
    return { ok: false, error: "Este partido ya no acepta cancelaciones" };
  }
  const matchMs = Date.parse(match.dateTime);
  if (Number.isNaN(matchMs)) {
    return { ok: false, error: "Fecha del partido inválida" };
  }
  const hoursUntil = (matchMs - nowMs) / (60 * 60 * 1000);
  if (hoursUntil < CANCEL_MIN_HOURS_BEFORE_MATCH) {
    return {
      ok: false,
      error: `Solo puedes cancelar hasta ${CANCEL_MIN_HOURS_BEFORE_MATCH} horas antes del partido`,
    };
  }
  return { ok: true };
}
