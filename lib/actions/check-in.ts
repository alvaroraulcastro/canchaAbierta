"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getMatchView } from "@/lib/catalog";
import { isCheckInWindowOpen } from "@/lib/check-in/policy";
import { verifyCheckInToken } from "@/lib/check-in/sign-token";
import { requireAdminPermission, requireVenueAccess } from "@/lib/auth/require-admin";
import { withMatchLock } from "@/lib/locks/match-lock";
import { appendAuditEntry } from "@/lib/sheets/repos/audit";
import {
  getInscription,
  markInscriptionCheckedIn,
} from "@/lib/sheets/repos/inscriptions";
import { inscriptionsTag, SHEET_TAGS } from "@/lib/sheets/tags";

const tokenSchema = z.string().trim().min(10);

export type CheckInActionResult =
  | { ok: true; alreadyCheckedIn: boolean; playerEmail: string; matchLabel: string }
  | { ok: false; error: string };

export async function processCheckInToken(formData: FormData): Promise<CheckInActionResult> {
  const admin = await requireAdminPermission("check_in");
  const parsed = tokenSchema.safeParse(formData.get("token"));
  if (!parsed.success) {
    return { ok: false, error: "Código QR inválido" };
  }

  const verified = verifyCheckInToken(parsed.data);
  if (!verified) {
    return { ok: false, error: "Código expirado o inválido" };
  }

  const inscription = await getInscription(verified.inscriptionId);
  if (!inscription || inscription.paymentStatus !== "paid") {
    return { ok: false, error: "Inscripción no válida para check-in" };
  }

  const match = await getMatchView(inscription.matchId);
  if (!match) {
    return { ok: false, error: "Partido no encontrado" };
  }

  try {
    await requireVenueAccess(match.venueId);
  } catch {
    return { ok: false, error: "No tienes acceso a este complejo" };
  }

  if (!isCheckInWindowOpen(match.dateTime, match.durationMin)) {
    return { ok: false, error: "Fuera de la ventana de check-in" };
  }

  const result = await withMatchLock(inscription.matchId, async () =>
    markInscriptionCheckedIn({
      inscriptionId: inscription.id,
      adminEmail: admin.email,
    }),
  );

  if (!result) {
    return { ok: false, error: "No se pudo registrar el ingreso" };
  }

  if (!result.alreadyCheckedIn) {
    await appendAuditEntry({
      adminEmail: admin.email,
      action: "update",
      entity: "inscription",
      entityId: inscription.id,
      before: null,
      after: { checkedInAt: new Date().toISOString(), via: "qr" },
    });
  }

  revalidateTag(SHEET_TAGS.Inscripciones);
  revalidateTag(SHEET_TAGS.AdminAudit);
  revalidateTag(inscriptionsTag(inscription.matchId));

  return {
    ok: true,
    alreadyCheckedIn: result.alreadyCheckedIn,
    playerEmail: inscription.playerEmail,
    matchLabel: `${match.courtName} · ${match.venueName}`,
  };
}
