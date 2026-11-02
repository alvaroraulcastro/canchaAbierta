"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { getMatchView } from "@/lib/catalog";
import { canPlayerCancelInscription } from "@/lib/inscriptions/cancel-policy";
import { withMatchLock } from "@/lib/locks/match-lock";
import {
  cancelInscriptionByPlayer,
  clearInscriptionCalendarEventId,
  getInscription,
} from "@/lib/sheets/repos/inscriptions";
import { decrementMatchPlayers } from "@/lib/sheets/repos/matches";
import { deleteMatchCalendarEvent } from "@/lib/google/calendar";
import { createLogger } from "@/lib/logger";
import { inscriptionsTag, matchTag, SHEET_TAGS } from "@/lib/sheets/tags";

const inscriptionIdSchema = z.string().trim().min(1);
const logger = createLogger("actions/cancel-inscription");

export async function cancelInscription(formData: FormData): Promise<void> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    redirect("/auth/signin?callbackUrl=/cuenta/mis-inscripciones");
  }

  const parsed = inscriptionIdSchema.safeParse(formData.get("inscriptionId"));
  if (!parsed.success) {
    redirect("/cuenta/mis-inscripciones?error=cancelacion");
  }
  const inscriptionId = parsed.data;

  const inscription = await getInscription(inscriptionId);
  if (!inscription || inscription.playerEmail.toLowerCase() !== email.toLowerCase()) {
    redirect("/cuenta/mis-inscripciones?error=cancelacion");
  }

  const match = await getMatchView(inscription.matchId);
  if (!match) {
    redirect("/cuenta/mis-inscripciones?error=cancelacion");
  }

  const policy = canPlayerCancelInscription(match, inscription);
  if (!policy.ok) {
    redirect(`/cuenta/mis-inscripciones?error=${encodeURIComponent(policy.error)}`);
  }

  await withMatchLock(inscription.matchId, async () => {
    if (inscription.calendarEventId) {
      try {
        await deleteMatchCalendarEvent(email, inscription.calendarEventId);
      } catch (error) {
        logger.error("No se pudo borrar evento de Calendar", error, {
          inscriptionId,
          eventId: inscription.calendarEventId,
        });
      }
      await clearInscriptionCalendarEventId(inscriptionId);
    }
    const cancelled = await cancelInscriptionByPlayer(inscriptionId);
    if (!cancelled) {
      redirect("/cuenta/mis-inscripciones?error=cancelacion");
    }
    await decrementMatchPlayers(inscription.matchId);
    revalidateTag(SHEET_TAGS.Inscripciones);
    revalidateTag(inscriptionsTag(inscription.matchId));
    revalidateTag(matchTag(inscription.matchId));
    redirect("/cuenta/mis-inscripciones?cancelada=1");
  });
}
